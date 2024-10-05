use crate::errors::ErrorCode;
use crate::{constants::*, CreateBankAccounts};
use crate::{sol_trust_config::*, AdminsWithdrawalAccount};
use anchor_lang::prelude::*;

pub fn withdraw_money(_ctx: Context<WithdrawMoney>, amount: u64) -> Result<()> {
    let create_bank_account = &mut _ctx.accounts.create_bank_account;
    let signer = _ctx.accounts.signer.key();
    let withdrawer = &mut _ctx.accounts.signer;

    // Check if the account is authorized
    create_bank_account.is_account_authorized(signer)?;

    // The `amount` should be converted in lamports
    let lamports = amount * 1000000000;

    require!(
        create_bank_account.balance >= lamports,
        ErrorCode::InvalidAmount
    );

    // Calculate fee (0.1% of the withdrawal amount)
    let fee = lamports
        .checked_div(1000)
        .ok_or_else(|| error!(ErrorCode::UnderFlowError))?; // 0.1% = 1/1000
    let amount_after_fee = lamports
        .checked_sub(fee)
        .ok_or_else(|| error!(ErrorCode::UnderFlowError))?;
    let admin_withdrawal_account = &mut _ctx.accounts.admin_withdraw_account;

    // Transfer the fee to the admin account safely
    **create_bank_account
        .to_account_info()
        .try_borrow_mut_lamports()? = create_bank_account
        .to_account_info()
        .lamports()
        .checked_sub(fee)
        .ok_or_else(|| error!(ErrorCode::UnderFlowError))?;

    **admin_withdrawal_account
        .to_account_info()
        .try_borrow_mut_lamports()? = admin_withdrawal_account
        .to_account_info()
        .lamports()
        .checked_add(fee)
        .ok_or_else(|| error!(ErrorCode::OverflowError))?;

    admin_withdrawal_account.balance = admin_withdrawal_account
        .balance
        .checked_add(fee)
        .ok_or_else(|| error!(ErrorCode::OverflowError))?;

    // Transfer the remaining lamports to the withdrawer safely
    **create_bank_account
        .to_account_info()
        .try_borrow_mut_lamports()? = create_bank_account
        .to_account_info()
        .lamports()
        .checked_sub(amount_after_fee)
        .ok_or_else(|| error!(ErrorCode::UnderFlowError))?;

    **withdrawer.to_account_info().try_borrow_mut_lamports()? = withdrawer
        .to_account_info()
        .lamports()
        .checked_add(amount_after_fee)
        .ok_or_else(|| error!(ErrorCode::OverflowError))?;

    // Update the bank account's balance safely
    create_bank_account.balance = create_bank_account
        .balance
        .checked_sub(lamports)
        .ok_or_else(|| error!(ErrorCode::UnderFlowError))?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u16)]
pub struct WithdrawMoney<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // The person who is withdrawing the money

    pub soltrustconfig: Box<Account<'info, SolTrustConfig>>,

    #[account(
        mut,
        seeds = [&signer.key().to_bytes(), CREATE_BANK_ACCOUNT.as_bytes()],
        bump,
    )]
    pub create_bank_account: Account<'info, CreateBankAccounts>, // The PDA account that receives the SOL

    #[account(
        mut,
        seeds = [ADMIN_WITHDRAWAL_ACCOUNT.as_ref()],
        bump,
    )]
    pub admin_withdraw_account: Box<Account<'info, AdminsWithdrawalAccount>>, // Admin account to collect the fee

    pub system_program: Program<'info, System>, // System program required for SOL transfer
}
