use anchor_lang::prelude::*;
pub mod constants;
pub mod errors;
pub mod instructions;
pub mod states;

use crate::errors::ErrorCode;
use crate::instructions::*;
use crate::states::*;

declare_id!("8Go6TspKm3rMV3N4ueARF8MqptuBAEP5H7iDP7XLSMcX");

pub mod admin {
    use anchor_lang::prelude::declare_id;
    #[cfg(feature = "devnet")]
    declare_id!("58KP8zx3yTLwa7tvT2dJdiG7n7uQKgTGDvhr3fV21z8a");
    #[cfg(not(feature = "devnet"))]
    declare_id!("GWLpjnxVGQTBKHp9CD3rkgi76P2hxWoDkPTk5LBvtsDq");
}

#[program]
pub mod sol_trust {
    use super::*;

    pub fn initialize_soltrust_config(
        _ctx: Context<InitializeSolTrust>,
        config_index: u8,
    ) -> Result<()> {
        instructions::initialize_soltrust_config(_ctx, config_index)?;
        Ok(())
    }

    pub fn initialize_admin_withdrawal_account(
        _ctx: Context<AdminWithdrawalAccount>,
    ) -> Result<()> {
        instructions::initialize_admin_withdrawal_account(_ctx)?;
        Ok(())
    }

    pub fn update_soltrust_config(
        _ctx: Context<UpdateSolTrust>,
        index: u8,
        value: u16,
    ) -> Result<()> {
        instructions::update_soltrust_config(_ctx, index, value)?;

        Ok(())
    }

    pub fn create_bank_account(_ctx: Context<CreateBankAccount>, name: [u8; 32]) -> Result<()> {
        instructions::create_bank_account(_ctx, name)?;
        Ok(())
    }

    pub fn deposit_money(_ctx: Context<DepositMoney>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        instructions::deposit_money(_ctx, amount)?;
        Ok(())
    }

    pub fn withdraw_money(_ctx: Context<WithdrawMoney>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        instructions::withdraw_money(_ctx, amount)?;
        Ok(())
    }

    pub fn withdraw_fees(_ctx: Context<WithdrawFees>, amount: u64) -> Result<()> {
        instructions::withdraw_fees(_ctx, amount)?;
        Ok(())
    }
}
