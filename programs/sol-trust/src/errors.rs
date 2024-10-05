use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Not approved")]
    NotApproved,

    #[msg("InvalidUpdateConfigFlag")]
    InvalidUpdateConfigFlag,

    #[msg("IncorrectAmount")]
    InvalidAmount,

    #[msg("NameTooLong")]
    NameTooLong,

    #[msg("Overflow")]
    OverflowError,

    #[msg("Underflow")]
    UnderFlowError,
}
