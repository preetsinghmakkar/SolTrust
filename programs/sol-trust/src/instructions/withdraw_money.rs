use crate::errors::ErrorCode;
use crate::{constants::*, CreateBankAccounts};
use crate::{sol_trust_config::*, AdminsWithdrawalAccount};
use anchor_lang::prelude::*;

pub fn withdraw_money(_ctx: Context<WithdrawMoney>, amount: u64, _name: String) -> Result<()> {
    let create_bank_account = &mut _ctx.accounts.create_bank_account;
    let signer = _ctx.accounts.signer.key();
    let withdrawer = &mut _ctx.accounts.signer;
    // Check if the account is authorized
    create_bank_account.is_account_authorized(signer)?;

    // Convert the amount to lamports (u16 -> u64)
    let lamports = amount as u64 * 1_000_000_000; // 1 SOL = 1,000,000,000 lamports

    require!(
        create_bank_account.balance >= lamports,
        ErrorCode::InvalidAmount
    );

    // Calculate fee (0.1% of the withdrawal amount)
    let fee = (lamports as f64 * 0.001) as u64;
    let amount_after_fee = lamports - fee;
    let admin_withdrawal_account = &mut _ctx.accounts.admin_withdraw_account;

    // Transfer the fee to the admin account
    **create_bank_account
        .to_account_info()
        .try_borrow_mut_lamports()? -= fee;
    **admin_withdrawal_account
        .to_account_info()
        .try_borrow_mut_lamports()? += fee;

    admin_withdrawal_account.balance += fee;

    //Transferring Money after deducting fee to the withdrawer
    **create_bank_account
        .to_account_info()
        .try_borrow_mut_lamports()? -= amount_after_fee;
    **withdrawer.to_account_info().try_borrow_mut_lamports()? += amount_after_fee;

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u16, _name: String)]
pub struct WithdrawMoney<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // The person who is depositing the money

    pub soltrustconfig: Box<Account<'info, SolTrustConfig>>,

    #[account(
        mut,
        seeds = [&_name.as_ref(), CREATE_BANK_ACCOUNT.as_bytes()],
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
