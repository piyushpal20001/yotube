import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { googleAdsService } from '../services/googleAds.service';

const prisma = new PrismaClient();

const getGoogleToken = async (userId: string) => {
  let tokens = await prisma.googleToken.findUnique({ where: { userId } });
  if (!tokens) {
    // Fallback to first available token in the database
    tokens = await prisma.googleToken.findFirst();
  }
  return tokens;
};

export const connectAccount = async (req: Request, res: Response) => {
  const { customerId, descriptiveName, isManager } = req.body;
  let userId = (req as any).user.userId;

  try {
    // Resolve external mock user to first database user if needed
    if (userId === 'admin-google-ads-user') {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) userId = firstUser.id;
    }

    const account = await prisma.googleAdsAccount.upsert({
      where: { customerId },
      update: { descriptiveName, isManager, userId },
      create: { customerId, descriptiveName, isManager, userId },
    });
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect account' });
  }
};

export const createCampaign = async (req: Request, res: Response) => {
  const { customerId, campaignData } = req.body;
  let userId = (req as any).user.userId;
  console.log('📝 Creating campaign for user:', userId, 'Body:', JSON.stringify(req.body));

  try {
    const tokens = await getGoogleToken(userId);
    if (!tokens) return res.status(401).json({ error: 'Google account not connected' });
    const realUserId = tokens.userId; // Use the actual user who owns the Google Token

    const customerIdToUse = customerId || '422-485-6978';
    const result = await googleAdsService.createCampaign(customerIdToUse, tokens.refreshToken, campaignData);

    // Find or create the Google Ads Account in our database first
    const googleAdsAccount = await prisma.googleAdsAccount.upsert({
      where: { customerId: customerIdToUse },
      update: {},
      create: {
        customerId: customerIdToUse,
        userId: realUserId,
        descriptiveName: 'Connected Account',
      },
    });

    // Save locally
    const campaign = await prisma.campaign.create({
      data: {
        googleCampaignId: result.resource_name,
        name: campaignData.name,
        status: 'PAUSED',
        budgetMicros: BigInt(campaignData.budgetMicros && campaignData.budgetMicros !== "" ? campaignData.budgetMicros : 50000000),
        accountId: googleAdsAccount.id,
      },
    });

    res.json({
      ...campaign,
      budgetMicros: campaign.budgetMicros.toString(),
    });
  } catch (error) {
    console.error('Create Campaign Error:', error);
    res.status(500).json({ 
      error: 'Failed to create campaign', 
      message: (error as any).message, 
      details: (error as any).details || (error as any).errors || error 
    });
  }
};

export const getCampaigns = async (req: Request, res: Response) => {
  let userId = (req as any).user.userId;
  try {
    const tokens = await getGoogleToken(userId);
    if (tokens) {
      userId = tokens.userId;
    }
    const accounts = await prisma.googleAdsAccount.findMany({ where: { userId } });
    const accountIds = accounts.map(a => a.id);

    const whereClause = accountIds.length > 0 ? { accountId: { in: accountIds } } : {};

    const campaigns = await prisma.campaign.findMany({
      where: whereClause,
      include: {
        adGroups: {
          include: {
            ads: true,
            keywords: true
          }
        }
      }
    });

    // Convert BigInt to string for JSON
    const formattedCampaigns = campaigns.map(c => ({
      ...c,
      budgetMicros: c.budgetMicros.toString()
    }));

    res.json(formattedCampaigns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};
export const listAccounts = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  try {
    const tokens = await getGoogleToken(userId);
    if (!tokens) return res.status(401).json({ error: 'Google account not connected' });

    const accounts = await googleAdsService.listAccessibleCustomers(tokens.refreshToken);
    res.json(accounts);
  } catch (error) {
    console.error('List Accounts Error:', error);
    res.status(500).json({ error: 'Failed to fetch accessible accounts', details: (error as any).message });
  }
};

export const createAdGroup = async (req: Request, res: Response) => {
  const { customerId, campaignResourceName, name } = req.body;
  const userId = (req as any).user.userId;

  try {
    const tokens = await getGoogleToken(userId);
    if (!tokens) return res.status(401).json({ error: 'Google account not connected' });

    const campaign = await prisma.campaign.findUnique({ where: { googleCampaignId: campaignResourceName } });
    if (!campaign) {
      return res.status(400).json({ 
        error: 'Campaign not synchronized',
        message: 'This campaign was created on Google Ads but is not found in your local database. Please refresh the page to sync campaigns, or select another campaign.'
      });
    }

    const campaignType = campaign.name.startsWith('[VIDEO]') ? 'VIDEO' : 'SEARCH';
    const result = await googleAdsService.createAdGroup(customerId, tokens.refreshToken, campaignResourceName, name, campaignType);

    const adGroup = await prisma.adGroup.create({
      data: {
        googleAdGroupId: result.resource_name,
        name: name,
        status: 'ENABLED',
        campaignId: campaign.id, 
      },
    });

    res.json(adGroup);
  } catch (error) {
    console.error('Create Ad Group Error:', error);
    res.status(500).json({ 
      error: 'Failed to create ad group',
      message: (error as any).message,
      details: (error as any).details || (error as any).errors || error
    });
  }
};

export const createAd = async (req: Request, res: Response) => {
  const { customerId, adGroupId, adData } = req.body;
  const userId = (req as any).user.userId;

  try {
    const tokens = await getGoogleToken(userId);
    if (!tokens) return res.status(401).json({ error: 'Google account not connected' });

    const adGroup = await prisma.adGroup.findUnique({ 
      where: { googleAdGroupId: adGroupId },
      include: { campaign: true }
    });

    const isVideo = adGroup?.campaign?.name.startsWith('[VIDEO]') || !!adData.videoUrl;
    if (isVideo) {
      adData.type = 'VIDEO';
    }

    const result = await googleAdsService.createAd(customerId, tokens.refreshToken, adGroupId, adData);

    const campaignResourceName = adGroup?.campaign?.googleCampaignId;
    if (campaignResourceName && adData.mediaUrl && !isVideo) {
      console.log(`🖼️ Uploading Campaign Image Extension: ${adData.mediaUrl} for campaign ${campaignResourceName}`);
      googleAdsService.uploadAndLinkCampaignImage(customerId, tokens.refreshToken, campaignResourceName, adData.mediaUrl);
    }

    const ad = await prisma.ad.create({
      data: {
        googleAdId: result.resource_name,
        headline: adData.headlines[0] || 'YouTube Video Ad',
        description: adData.descriptions[0] || 'YouTube Video Ad Campaign',
        mediaUrl: adData.videoUrl || adData.mediaUrl || '',
        adGroupId: adGroup?.id || '',
      },
    });

    res.json(ad);
  } catch (error) {
    console.error('Create Ad Error:', error);
    res.status(500).json({ 
      error: 'Failed to create ad',
      message: (error as any).message,
      details: (error as any).details || (error as any).errors || error
    });
  }
};

export const createLead = async (req: Request, res: Response) => {
  const { name, email, phone, adId } = req.body;
  try {
    const lead = await prisma.lead.create({
      data: { name, email, phone, adId },
    });
    res.json(lead);
  } catch (error) {
    console.error('Create Lead Error:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
};

export const getLeads = async (req: Request, res: Response) => {
  try {
    const leads = await prisma.lead.findMany({
      include: { ad: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(leads);
  } catch (error) {
    console.error('Get Leads Error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

export const createKeyword = async (req: Request, res: Response) => {
  const { adGroupId, text, matchType } = req.body;
  try {
    const keyword = await prisma.keyword.create({
      data: {
        googleKeywordId: `customers/mock/keywords/${Date.now()}`,
        text,
        matchType: matchType || 'BROAD',
        adGroupId
      }
    });
    res.json(keyword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add keyword' });
  }
};
