use crate::constants::ADMIN_WITHDRAWAL_ACCOUNT;
use crate::errors::ErrorCode;
use crate::AdminsWithdrawalAccount;
use anchor_lang::prelude::*;

pub fn withdraw_fees(ctx: Context<WithdrawFees>, amount: u64) -> Result<()> {
    let admin_account = &mut ctx.accounts.admin_account;
    let admin = &mut ctx.accounts.admin;

    msg!("Amount to Withdraw: {}", amount);

    let lamports = amount
        .checked_mul(1000000000)
        .ok_or_else(|| error!(ErrorCode::OverflowError))?; // Amount in lamports

    msg!("Entered Fees in Lamports to withdraw : {}", lamports);

    // Ensure the admin has enough balance to withdraw
    require!(admin_account.balance >= lamports, ErrorCode::InvalidAmount);

    msg!("Balance of the Admin Account : {}", admin_account.balance);

    msg!("Admin ID : {}", admin.key());

    // Transfer lamports to the admin

    admin_account
        .to_account_info()
        .try_borrow_mut_lamports()?
        .checked_sub(lamports)
        .ok_or_else(|| error!(ErrorCode::UnderFlowError))?;

    admin
        .to_account_info()
        .try_borrow_mut_lamports()?
        .checked_add(lamports)
        .ok_or_else(|| error!(ErrorCode::OverflowError))?;

    // Update the admin account balance
    admin_account.balance = admin_account
        .balance
        .checked_sub(lamports)
        .ok_or_else(|| error!(ErrorCode::UnderFlowError))?; // Subtract the withdrawn amount from the balance

    msg!("Admin Balance after updating : {}", admin_account.balance);
    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(mut,
        address = crate::admin::id() @ ErrorCode::NotApproved)]
    pub admin: Signer<'info>, // Admin withdrawing the fees

    #[account(
        mut,
        seeds = [ADMIN_WITHDRAWAL_ACCOUNT.as_ref()],
        bump,
    )]
    pub admin_account: Account<'info, AdminsWithdrawalAccount>, // The admin account holding the fees

    pub system_program: Program<'info, System>,
}
