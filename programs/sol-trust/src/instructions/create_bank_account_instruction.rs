use anchor_lang::prelude::*;
use crate::{constants::*, CreateBankAccounts, SolTrustConfig};


pub fn create_bank_account(
    _ctx: Context<CreateBankAccount>,
    name: String,
) -> Result<()> {
   

   let clock = Clock::get()?;

   let create_bank_account = &mut _ctx.accounts.create_bank_account;


   msg!("Expected create_bank_account PDA: {:?}", create_bank_account.key());




create_bank_account.holder = _ctx.accounts.signer.key();
create_bank_account.balance = 0;
create_bank_account.holder_name = name;
create_bank_account.created_at = clock.unix_timestamp;

msg!("Created At :  {clock.unix_timestamp}");


    Ok(())
}


#[derive(Accounts)]
pub struct CreateBankAccount<'info> {
   
    #[account(mut)]
    pub signer: Signer<'info>,

    /// Which config the Bank belongs to.
    #[account(mut)]
    pub soltrustconfig: Box<Account<'info, SolTrustConfig>>,

    #[account(
        init,
        payer = signer,
        seeds = [&signer.key().to_bytes(), CREATE_BANK_ACCOUNT.as_bytes()], 
        bump, 
        space = 32 + CreateBankAccounts::LEN
    )]
    pub create_bank_account: Account<'info, CreateBankAccounts>,

    pub system_program: Program<'info, System>,
}

