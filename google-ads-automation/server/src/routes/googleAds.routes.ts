import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { connectAccount, createCampaign, getCampaigns, listAccounts, createAdGroup, createAd, createLead, getLeads, createKeyword } from '../controllers/googleAds.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/leads', createLead);

router.use(authMiddleware);

router.post('/connect', connectAccount);
router.get('/list-accounts', listAccounts);
router.post('/campaigns', createCampaign);
router.get('/campaigns', getCampaigns);
router.post('/ad-groups', createAdGroup);
router.post('/ads', createAd);
router.post('/keywords', createKeyword);
router.get('/leads', getLeads);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

router.post('/upload', upload.single('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

export default router;
