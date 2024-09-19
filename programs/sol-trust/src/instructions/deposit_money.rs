use crate::sol_trust_config::*;
use crate::{constants::*, CreateBankAccounts};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

pub fn deposit_money(_ctx: Context<DepositMoney>, amount: u64, _name: String) -> Result<()> {
    let create_bank_account = &mut _ctx.accounts.create_bank_account;

    msg!(
        "Expected Deposit Money PDA: {:?}",
        create_bank_account.key()
    );

    let signer = _ctx.accounts.signer.key();

    // Check if the account is authorized
    create_bank_account.is_account_authorized(signer)?;

    // Convert the amount to lamports (u16 -> u64)
    let lamports = amount as u64 * 1_000_000_000; // 1 SOL = 1,000,000,000 lamports

    let signer_info = _ctx.accounts.signer.to_account_info();
    let bank_account_info = create_bank_account.to_account_info();
    let system_program_info = _ctx.accounts.system_program.to_account_info();

    // 1. Transfer SOL from the signer to the create_bank_account PDA
    let transfer_ix = system_instruction::transfer(
        &signer_info.key(),       // Sender (signer)
        &bank_account_info.key(), // Receiver (PDA account)
        lamports,                 // Amount in lamports
    );

    // 2. Invoke the transfer instruction
    anchor_lang::solana_program::program::invoke(
        &transfer_ix,
        &[signer_info, bank_account_info, system_program_info],
    )?;

    // Update the account balance
    create_bank_account.balance += lamports;

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u16)]
pub struct DepositMoney<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // The person who is depositing the money

    pub soltrustconfig: Box<Account<'info, SolTrustConfig>>,

    #[account(
        mut,
        seeds = [&signer.key().to_bytes(), CREATE_BANK_ACCOUNT.as_bytes()],
        bump,
    )]
    pub create_bank_account: Account<'info, CreateBankAccounts>, // The PDA account that receives the SOL

    pub system_program: Program<'info, System>, // System program required for SOL transfer
}
