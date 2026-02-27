import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Campaigns endpoint' });
});

export default router;
