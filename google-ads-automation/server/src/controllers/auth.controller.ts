import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Helper to get OAuth client with latest env vars
const getOAuthClient = () => {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );
};

export const getGoogleAuthUrl = (req: Request, res: Response) => {
  const client = getOAuthClient();
  const scopes = [
    'https://www.googleapis.com/auth/adwords',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  res.json({ url });
};

export const googleCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  const client = getOAuthClient();

  try {
    const { tokens } = await client.getToken(code as string);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    let user = await prisma.user.upsert({
      where: { email: payload.email },
      update: { name: payload.name },
      create: {
        email: payload.email,
        name: payload.name,
      },
    });

    if (tokens.refresh_token) {
      await prisma.googleToken.upsert({
        where: { userId: user.id },
        update: {
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token,
          expiryDate: new Date(tokens.expiry_date!),
        },
        create: {
          userId: user.id,
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token,
          expiryDate: new Date(tokens.expiry_date!),
        },
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    res.redirect(`http://localhost:3000/auth-success?token=${token}`);
  } catch (error) {
    console.error('CRITICAL OAuth Error:', error);
    res.status(500).json({ error: 'Authentication failed', details: (error as any).message });
  }
};
