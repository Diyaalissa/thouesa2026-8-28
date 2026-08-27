import { adminDb } from '../firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export type TransactionType = 
  | 'CASH_DEPOSIT_TO_EMPLOYEE'
  | 'ESCROW_DEPOSIT_BY_TRAVELER'
  | 'SHIPMENT_PAYMENT'
  | 'ESCROW_RELEASE'
  | 'CASH_WITHDRAWAL_FROM_EMPLOYEE';

export interface LedgerTransaction {
  id: string;
  transactionCode: string;
  walletId: string;
  userId: string;
  employeeId?: string; // The hub agent involved in the cash handling
  type: TransactionType;
  amount: number;
  currency: string;
  status: 'COMMITTED' | 'FAILED';
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  lockedEscrowDeposit: number;
  pendingEarnings: number;
  currency: string;
  updatedAt: string;
}

export class WalletService {
  /**
   * Retrieves or initializes a wallet for a user.
   */
  static async getWallet(userId: string): Promise<Wallet> {
    const walletRef = adminDb.collection('wallets').doc(`wlt-${userId}`);
    const snap = await walletRef.get();

    if (!snap.exists) {
      const newWallet: Wallet = {
        id: `wlt-${userId}`,
        userId,
        balance: 0,
        lockedEscrowDeposit: 0,
        pendingEarnings: 0,
        currency: 'USD',
        updatedAt: new Date().toISOString(),
      };
      await walletRef.set(newWallet);
      return newWallet;
    }
    return snap.data() as Wallet;
  }

  /**
   * Cash Deposit to Employee:
   * A sender hands cash to a local employee. The employee registers this.
   * Increases Sender's Available Balance.
   */
  static async processCashDeposit(userId: string, employeeId: string, amount: number, currency: string = 'USD'): Promise<Wallet> {
    if (amount <= 0) throw new Error("Amount must be positive");

    const walletRef = adminDb.collection('wallets').doc(`wlt-${userId}`);
    const txRef = adminDb.collection('transactions').doc();

    await adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(walletRef);
      if (!snap.exists) {
        throw new Error("Wallet not found. Initialize first.");
      }
      const currentWallet = snap.data() as Wallet;

      // Create transaction record
      const txData: LedgerTransaction = {
        id: txRef.id,
        transactionCode: `DEP-${Date.now().toString().slice(-6)}`,
        walletId: currentWallet.id,
        userId,
        employeeId,
        type: 'CASH_DEPOSIT_TO_EMPLOYEE',
        amount,
        currency,
        status: 'COMMITTED',
        createdAt: new Date().toISOString(),
      };
      transaction.set(txRef, txData);

      // Update wallet balance
      transaction.update(walletRef, {
        balance: FieldValue.increment(amount),
        updatedAt: new Date().toISOString(),
      });
    });

    return this.getWallet(userId);
  }

  /**
   * Escrow Deposit by Traveler:
   * Traveler hands cash to a local employee for security deposit.
   * Increases Traveler's Locked Escrow Balance.
   */
  static async lockTravelerEscrow(userId: string, employeeId: string, amount: number, currency: string = 'USD'): Promise<Wallet> {
    if (amount <= 0) throw new Error("Amount must be positive");

    const walletRef = adminDb.collection('wallets').doc(`wlt-${userId}`);
    const txRef = adminDb.collection('transactions').doc();

    await adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(walletRef);
      if (!snap.exists) throw new Error("Wallet not found.");
      
      const currentWallet = snap.data() as Wallet;

      const txData: LedgerTransaction = {
        id: txRef.id,
        transactionCode: `ESC-${Date.now().toString().slice(-6)}`,
        walletId: currentWallet.id,
        userId,
        employeeId,
        type: 'ESCROW_DEPOSIT_BY_TRAVELER',
        amount,
        currency,
        status: 'COMMITTED',
        createdAt: new Date().toISOString(),
      };
      transaction.set(txRef, txData);

      transaction.update(walletRef, {
        lockedEscrowDeposit: FieldValue.increment(amount),
        updatedAt: new Date().toISOString(),
      });
    });

    return this.getWallet(userId);
  }

  /**
   * Sender pays for a shipment (deducts from available balance)
   */
  static async payForShipment(userId: string, amount: number): Promise<Wallet> {
    if (amount <= 0) throw new Error("Amount must be positive");

    const walletRef = adminDb.collection('wallets').doc(`wlt-${userId}`);
    const txRef = adminDb.collection('transactions').doc();

    await adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(walletRef);
      if (!snap.exists) throw new Error("Wallet not found.");
      
      const currentWallet = snap.data() as Wallet;
      if (currentWallet.balance < amount) {
        throw new Error(`Insufficient funds. Available: $${currentWallet.balance}, Required: $${amount}`);
      }

      const txData: LedgerTransaction = {
        id: txRef.id,
        transactionCode: `SHP-${Date.now().toString().slice(-6)}`,
        walletId: currentWallet.id,
        userId,
        type: 'SHIPMENT_PAYMENT',
        amount: -Math.abs(amount), // negative
        currency: currentWallet.currency,
        status: 'COMMITTED',
        createdAt: new Date().toISOString(),
      };
      transaction.set(txRef, txData);

      transaction.update(walletRef, {
        balance: FieldValue.increment(-amount),
        updatedAt: new Date().toISOString(),
      });
    });

    return this.getWallet(userId);
  }

  /**
   * Cash Withdrawal From Employee:
   * Traveler takes cash from a local employee (Earnings + Released Escrow).
   */
  static async processCashWithdrawal(userId: string, employeeId: string, amount: number): Promise<Wallet> {
    if (amount <= 0) throw new Error("Amount must be positive");

    const walletRef = adminDb.collection('wallets').doc(`wlt-${userId}`);
    const txRef = adminDb.collection('transactions').doc();

    await adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(walletRef);
      if (!snap.exists) throw new Error("Wallet not found.");
      
      const currentWallet = snap.data() as Wallet;
      if (currentWallet.balance < amount) {
        throw new Error(`Insufficient funds for withdrawal. Available: $${currentWallet.balance}`);
      }

      const txData: LedgerTransaction = {
        id: txRef.id,
        transactionCode: `WDR-${Date.now().toString().slice(-6)}`,
        walletId: currentWallet.id,
        userId,
        employeeId,
        type: 'CASH_WITHDRAWAL_FROM_EMPLOYEE',
        amount: -Math.abs(amount), // negative
        currency: currentWallet.currency,
        status: 'COMMITTED',
        createdAt: new Date().toISOString(),
      };
      transaction.set(txRef, txData);

      transaction.update(walletRef, {
        balance: FieldValue.increment(-amount),
        updatedAt: new Date().toISOString(),
      });
    });

    return this.getWallet(userId);
  }
}
