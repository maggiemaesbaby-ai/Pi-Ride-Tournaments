-- Add 1.0 Pi to user balance for testing PWA linking
UPDATE arcade.user_balances 
SET balance = balance + 1.0, 
    updated_at = NOW() 
WHERE user_id = '86e69422-ffa5-472e-8a2c-55af0c860665';

-- Verify the new balance
SELECT user_id, balance, updated_at 
FROM arcade.user_balances 
WHERE user_id = '86e69422-ffa5-472e-8a2c-55af0c860665';
