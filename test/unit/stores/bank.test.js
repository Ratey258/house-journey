import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePlayerStore } from '../../../src/stores/player';

describe('Bank Functionality', () => {
  beforeEach(() => {
    // 创建新的Pinia实例并设为活动实例
    const pinia = createPinia();
    setActivePinia(pinia);
  });

  describe('Bank Deposits', () => {
    it('should deposit money successfully', () => {
      const playerStore = usePlayerStore();
      playerStore.money = 5000;
      playerStore.bankDeposit = 0;

      const result = playerStore.depositToBank(2000);

      expect(result).toBe(true);
      expect(playerStore.money).toBe(3000);
      expect(playerStore.bankDeposit).toBe(2000);
    });

    it('should not deposit more than available money', () => {
      const playerStore = usePlayerStore();
      playerStore.money = 1000;
      playerStore.bankDeposit = 0;

      const result = playerStore.depositToBank(2000);

      expect(result).toBe(false);
      expect(playerStore.money).toBe(1000);
      expect(playerStore.bankDeposit).toBe(0);
    });

    it('should handle zero or negative deposit amounts', () => {
      const playerStore = usePlayerStore();
      playerStore.money = 5000;
      playerStore.bankDeposit = 0;

      const result1 = playerStore.depositToBank(0);
      const result2 = playerStore.depositToBank(-100);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(playerStore.money).toBe(5000);
      expect(playerStore.bankDeposit).toBe(0);
    });
  });

  describe('Bank Withdrawals', () => {
    it('should withdraw money successfully', () => {
      const playerStore = usePlayerStore();
      playerStore.money = 1000;
      playerStore.bankDeposit = 3000;

      const result = playerStore.withdrawFromBank(2000);

      expect(result).toBe(true);
      expect(playerStore.money).toBe(3000);
      expect(playerStore.bankDeposit).toBe(1000);
    });

    it('should not withdraw more than available deposit', () => {
      const playerStore = usePlayerStore();
      playerStore.money = 1000;
      playerStore.bankDeposit = 500;

      const result = playerStore.withdrawFromBank(1000);

      expect(result).toBe(false);
      expect(playerStore.money).toBe(1000);
      expect(playerStore.bankDeposit).toBe(500);
    });
  });

  describe('Bank Loans', () => {
    it('should take a loan successfully', () => {
      const playerStore = usePlayerStore();
      playerStore.money = 1000;
      playerStore.debt = 0;
      playerStore.maxLoanAmount = 10000;

      const result = playerStore.takeLoan(5000);

      expect(result).toBe(true);
      expect(playerStore.money).toBe(6000);
      expect(playerStore.debt).toBe(5000);
    });

    it('should not exceed maximum loan amount', () => {
      const playerStore = usePlayerStore();
      playerStore.money = 1000;
      playerStore.debt = 8000;
      playerStore.maxLoanAmount = 10000;

      const result = playerStore.takeLoan(3000);

      expect(result).toBe(false);
      expect(playerStore.money).toBe(1000);
      expect(playerStore.debt).toBe(8000);
    });

    it('should repay debt successfully', () => {
      const playerStore = usePlayerStore();
      playerStore.money = 5000;
      playerStore.debt = 8000;

      const result = playerStore.repayDebt(3000);

      expect(result).toBe(true);
      expect(playerStore.money).toBe(2000);
      expect(playerStore.debt).toBe(5000);
    });
  });

  describe('Interest Calculations', () => {
    it('should add interest to deposits weekly', () => {
      const playerStore = usePlayerStore();
      playerStore.bankDeposit = 10000;
      const interestRate = 0.003; // 0.3%
      const expectedInterest = Math.floor(10000 * interestRate); // 30

      playerStore.updateWeeklyPlayerState(2);

      expect(playerStore.bankDeposit).toBe(10000 + expectedInterest);
    });

    it('should add interest to debt weekly', () => {
      const playerStore = usePlayerStore();
      playerStore.debt = 10000;
      const interestRate = 0.005; // 0.5%
      const expectedInterest = Math.floor(10000 * interestRate); // 50

      playerStore.updateWeeklyPlayerState(2);

      expect(playerStore.debt).toBe(10000 + expectedInterest);
    });
  });
});
