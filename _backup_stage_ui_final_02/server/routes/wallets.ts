import { Request, Response, Router } from 'express';
import { WalletService } from '../services/wallet.service';
import { adminDb } from '../firebaseAdmin';

export const walletRouter = Router();

// GET /api/wallets/:userId
walletRouter.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const wallet = await WalletService.getWallet(userId);
    res.json({ success: true, wallet });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/wallets/:userId/transactions
walletRouter.get('/:userId/transactions', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const snapshot = await adminDb.collection('transactions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
      
    const transactions = snapshot.docs.map(doc => doc.data());
    res.json({ success: true, transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/wallets/deposit (Cash received by employee)
walletRouter.post('/deposit', async (req: Request, res: Response) => {
  try {
    // In a real app, employeeId comes from JWT context
    const { userId, employeeId, amount, currency } = req.body;
    if (!userId || !employeeId || !amount) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }
    const wallet = await WalletService.processCashDeposit(userId, employeeId, Number(amount), currency);
    res.json({ success: true, message: 'Deposit successful', wallet });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/wallets/escrow/lock (Traveler deposits cash to employee)
walletRouter.post('/escrow/lock', async (req: Request, res: Response) => {
  try {
    const { userId, employeeId, amount, currency } = req.body;
    if (!userId || !employeeId || !amount) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }
    const wallet = await WalletService.lockTravelerEscrow(userId, employeeId, Number(amount), currency);
    res.json({ success: true, message: 'Escrow locked successfully', wallet });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/wallets/withdraw (Traveler withdraws cash from employee)
walletRouter.post('/withdraw', async (req: Request, res: Response) => {
  try {
    const { userId, employeeId, amount } = req.body;
    if (!userId || !employeeId || !amount) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }
    const wallet = await WalletService.processCashWithdrawal(userId, employeeId, Number(amount));
    res.json({ success: true, message: 'Withdrawal successful', wallet });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});
