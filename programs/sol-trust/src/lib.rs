use anchor_lang::prelude::*;
pub mod constants;
pub mod errors;
pub mod instructions;
pub mod states;

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
        deposit_fee: u16,
    ) -> Result<()> {
        instructions::initialize_soltrust_config(_ctx, config_index, deposit_fee)?;
        Ok(())
    }
}
