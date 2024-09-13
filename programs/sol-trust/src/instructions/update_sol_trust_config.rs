use crate::errors::ErrorCode;
use crate::sol_trust_config::*;
use anchor_lang::prelude::*;

pub fn update_soltrust_config(ctx: Context<UpdateSolTrust>, index: u8, value: u16) -> Result<()> {
    let soltrustconfigs = &mut ctx.accounts.soltrustconfig;

    match index {
        0 => update_config_index(soltrustconfigs, value),
        1 => update_config_deposit_fee(soltrustconfigs, value),
        _ => return err!(ErrorCode::InvalidUpdateConfigFlag),
    };

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateSolTrust<'info> {
    // Address to be set as the owner.
    #[account(mut,
        address = crate::admin::id() @ ErrorCode::NotApproved)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub soltrustconfig: Account<'info, SolTrustConfig>,

    pub system_program: Program<'info, System>,
}

pub fn update_config_index(soltrustconfigs: &mut Account<SolTrustConfig>, value: u16) {
    let val = value as u8;
    soltrustconfigs.config_index = val;
}

pub fn update_config_deposit_fee(soltrustconfigs: &mut Account<SolTrustConfig>, value: u16) {
    soltrustconfigs.deposit_fee = value;
}
