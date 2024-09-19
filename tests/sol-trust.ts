import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolTrust } from "../target/types/sol_trust";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";

describe("sol-trust", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolTrust as Program<SolTrust>;

  it("Is initialized by admin!", async () => {
    const configIndex = 0;

    const [configPDA, _bump] = PublicKey.findProgramAddressSync(
      [Buffer.from([configIndex]), Buffer.from("soltrust_config")], // Your seed logic
      program.programId
    );

    console.log("Client-side config PDA:", configPDA.toBase58());

    // Call the initializeSoltrustConfig instruction and pass the admin keypair as the signer
    const tx = await program.methods
      .initializeSoltrustConfig(new anchor.BN(configIndex))
      .accounts({
        // owner: program.provider.publicKey, // Admin as the owner
        soltrustconfig: configPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Your transaction signature:", tx);

    // Fetch the SolTrustConfig account data
    const solTrustConfigAccount = await program.account.solTrustConfig.fetch(
      configPDA
    );

    // Check if the values are set correctly
    expect(solTrustConfigAccount.configIndex).to.equal(configIndex);
    expect(solTrustConfigAccount.owner.toBase58()).to.equal(
      program.provider.publicKey.toBase58()
    );

    console.log("Account data after initialization:", solTrustConfigAccount);
  });

  it("Is Updating Working Right? ", async () => {
    const configIndex = 0;

    const [configPDA, _bump] = PublicKey.findProgramAddressSync(
      [Buffer.from([configIndex]), Buffer.from("soltrust_config")], // Your seed logic
      program.programId
    );

    console.log("Client-side config PDA:", configPDA.toBase58());

    const tx = await program.methods
      .updateSoltrustConfig(new anchor.BN(0), new anchor.BN(1))
      .accounts({
        soltrustconfig: configPDA,
      })
      .rpc();

    console.log(tx);

    const solTrustConfigAccount = await program.account.solTrustConfig.fetch(
      configPDA
    );

    // Check if the values are updated correctly
    expect(solTrustConfigAccount.configIndex).to.equal(1);
  });

  it("Testing Create Bank Account", async () => {
    const name = "Preet";
    const configIndex = 0;

    const [configPDA, _bump] = PublicKey.findProgramAddressSync(
      [Buffer.from([configIndex]), Buffer.from("soltrust_config")], // Your seed logic
      program.programId
    );

    const [createBankAccountPDA, _createBankAccountBump] =
      PublicKey.findProgramAddressSync(
        [
          provider.wallet.publicKey.toBuffer(),
          Buffer.from("create_bank_account"),
        ], // Updated seed logic for the bank account
        program.programId
      );

    const tx = await program.methods
      .createBankAccount(name)
      .accounts({
        signer: provider.wallet.publicKey, // Use wallet public key as signer
        soltrustconfig: configPDA,
        createBankAccount: createBankAccountPDA, // Ensure correct key name is used
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const createBankAccount = await program.account.createBankAccounts.fetch(
      createBankAccountPDA
    );

    console.log("Balance of Preet:", createBankAccount.balance);

    // Expect statement for holder (public key)
    expect(createBankAccount.holder.toBase58()).to.equal(
      provider.wallet.publicKey.toBase58()
    );

    // Expect statement for balance (initialized to 0)
    expect(createBankAccount.balance.toString()).to.equal(
      new anchor.BN(0).toString()
    );

    // Expect statement for holder_name (should be "Preet")
    expect(createBankAccount.holderName).to.equal(name);

    // Get the current timestamp for comparison
    const currentSlot = await provider.connection.getSlot();
    const clock = await provider.connection.getBlockTime(currentSlot);

    // Expect statement for created_at (timestamp)
    expect(Number(createBankAccount.createdAt)).to.be.closeTo(clock, 5); // Allow a 5-second tolerance
  });

  it("Deposit Money", async () => {
    const name = "Preet";
    const configIndex = 0;
    const amount = 1000;

    const [configPDA, _bump] = PublicKey.findProgramAddressSync(
      [Buffer.from([configIndex]), Buffer.from("soltrust_config")], // Seed logic for config
      program.programId
    );

    const [createBankAccountPDA, _createBankAccountBump] =
      PublicKey.findProgramAddressSync(
        [
          provider.wallet.publicKey.toBuffer(),
          Buffer.from("create_bank_account"),
        ],
        program.programId
      );

    console.log(
      "Test-side createBankAccount PDA:",
      createBankAccountPDA.toBase58()
    );

    const tx = await program.methods
      .depositMoney(new anchor.BN(amount), name)
      .accounts({
        signer: provider.wallet.publicKey, // Ensure this is included
        soltrustconfig: configPDA,
        createBankAccount: createBankAccountPDA, // Ensure correct key name is used
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Deposit Money:", tx);

    // Fetch the updated create bank account and verify the balance
    const updatedCreateBankAccount =
      await program.account.createBankAccounts.fetch(createBankAccountPDA);

    // Check if the balance has increased by the deposit amount
    expect(updatedCreateBankAccount.balance.toString()).to.equal(
      new anchor.BN(amount * 1_000_000_000).toString()
    );

    console.log(
      "Balance of Preet : ",
      updatedCreateBankAccount.balance.toString()
    );
  });

  // Utility function to initialize admin withdrawal account
  async function initializeAdminWithdrawalAccount() {
    const [adminWithdrawAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin_withdrawal_account")],
      program.programId
    );

    // Check if the admin withdrawal account already exists
    try {
      await program.account.adminsWithdrawalAccount.fetch(
        adminWithdrawAccountPDA
      );
    } catch (e) {
      // Admin withdrawal account does not exist, so we need to initialize it
      await program.methods
        .initializeAdminWithdrawalAccount() // Make sure you have this method in your program
        .accounts({
          adminWithdrawAccount: adminWithdrawAccountPDA,
          signer: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    }
  }

  // it("Withdraws Money Back", async () => {
  //   const name = "Preet";
  //   const configIndex = 0;
  //   const amount = 1000; // Amount in lamports

  //   // Find the PDAs (config, bank account, and admin withdraw account)
  //   const [configPDA] = PublicKey.findProgramAddressSync(
  //     [Buffer.from([configIndex]), Buffer.from("soltrust_config")],
  //     program.programId
  //   );

  //   const [createBankAccountPDA] = PublicKey.findProgramAddressSync(
  //     [
  //       provider.wallet.publicKey.toBuffer(),
  //       Buffer.from("create_bank_account"),
  //     ],
  //     program.programId
  //   );

  //   const [adminWithdrawAccountPDA] = PublicKey.findProgramAddressSync(
  //     [Buffer.from("admin_withdrawal_account")],
  //     program.programId
  //   );

  //   // Initialize admin withdrawal account if not already initialized
  //   await initializeAdminWithdrawalAccount();

  //   // Perform withdrawal
  //   const tx = await program.methods
  //     .withdrawMoney(new anchor.BN(amount), name)
  //     .accounts({
  //       signer: provider.wallet.publicKey,
  //       soltrustconfig: configPDA,
  //       createBankAccount: createBankAccountPDA,
  //       adminWithdrawAccount: adminWithdrawAccountPDA,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //     })
  //     .rpc();

  //   console.log("Withdraw transaction signature:", tx);

  //   // Fetch updated account balances
  //   const updatedBankAccount = await program.account.createBankAccounts.fetch(
  //     createBankAccountPDA
  //   );
  //   const updatedAdminWithdrawAccount =
  //     await program.account.adminsWithdrawalAccount.fetch(
  //       adminWithdrawAccountPDA
  //     );

  //   // Log balances and calculations
  //   const expectedFee = amount * 0.001; // 0.1% fee
  //   const amountAfterFee = amount - expectedFee;

  //   console.log(`Expected Fee: ${expectedFee}`);
  //   console.log(`Amount After Fee: ${amountAfterFee}`);
  //   console.log(
  //     `Bank Account Balance: ${updatedBankAccount.balance.toString()}`
  //   );
  //   console.log(
  //     `Admin Account Balance: ${updatedAdminWithdrawAccount.balance.toString()}`
  //   );

  //   console.log(
  //     "Consoling Admin Account Balance : ",
  //     updatedAdminWithdrawAccount.balance.toNumber()
  //   );
  //   console.log("Consoling the fee: ", expectedFee);

  //   console.log(
  //     "Consoling User's PDA Account Balance",
  //     updatedBankAccount.balance.toNumber()
  //   );
  //   console.log("Consoling Amount After Fee :", amountAfterFee * 1000000000);

  //   // Check if the balances are correct
  //   expect(updatedBankAccount.balance.toNumber()).to.be.below(
  //     amountAfterFee * 1000000000
  //   );
  //   expect(updatedAdminWithdrawAccount.balance.toNumber()).to.equal(
  //     expectedFee * 1000000000
  //   );
  // });

  it("Withdraws Money Back", async () => {
    const name = "Preet";
    const configIndex = 0;
    const amountSol = 1000; // Amount in SOL
    const amountLamports = amountSol * 1000000000;

    // Find the PDAs (config, bank account, and admin withdraw account)
    const [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from([configIndex]), Buffer.from("soltrust_config")],
      program.programId
    );

    const [createBankAccountPDA] = PublicKey.findProgramAddressSync(
      [
        provider.wallet.publicKey.toBuffer(),
        Buffer.from("create_bank_account"),
      ],
      program.programId
    );

    const [adminWithdrawAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin_withdrawal_account")],
      program.programId
    );

    // Fetch signer's balance before withdrawal
    const signerBalanceBefore = await provider.connection.getBalance(
      provider.wallet.publicKey
    );
    console.log(`Signer's Balance Before Withdrawal: ${signerBalanceBefore}`);

    // Initialize admin withdrawal account if not already initialized
    await initializeAdminWithdrawalAccount();

    // Perform withdrawal
    const tx = await program.methods
      .withdrawMoney(new anchor.BN(amountLamports), name)
      .accounts({
        signer: provider.wallet.publicKey,
        soltrustconfig: configPDA,
        createBankAccount: createBankAccountPDA,
        adminWithdrawAccount: adminWithdrawAccountPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Withdraw transaction signature:", tx);

    // Fetch updated account balances
    const updatedBankAccount = await program.account.createBankAccounts.fetch(
      createBankAccountPDA
    );
    const updatedAdminWithdrawAccount =
      await program.account.adminsWithdrawalAccount.fetch(
        adminWithdrawAccountPDA
      );

    // Log balances and calculations
    const expectedFee = amountLamports * 0.001; // 0.1% fee in lamports
    const amountAfterFee = amountLamports - expectedFee;

    console.log(`Expected Fee: ${expectedFee}`);
    console.log(`Amount After Fee: ${amountAfterFee}`);
    console.log(
      `Bank Account Balance: ${updatedBankAccount.balance.toString()}`
    );
    console.log(
      `Admin Account Balance: ${updatedAdminWithdrawAccount.balance.toString()}`
    );

    console.log(
      "Consoling Admin Account Balance : ",
      updatedAdminWithdrawAccount.balance.toNumber()
    );
    console.log("Consoling the fee: ", expectedFee);

    console.log(
      "Consoling User's PDA Account Balance",
      updatedBankAccount.balance.toNumber()
    );
    console.log("Consoling Amount After Fee :", amountAfterFee);

    // Fetch signer's balance before withdrawal
    const signerBalanceAfter = await provider.connection.getBalance(
      provider.wallet.publicKey
    );
    console.log(`Signer's Balance After Withdrawal: ${signerBalanceAfter}`);

    // Check if the balances are correct
    expect(updatedBankAccount.balance.toNumber()).to.be.below(amountAfterFee);
    expect(updatedAdminWithdrawAccount.balance.toNumber()).to.equal(
      expectedFee
    );
  });
});
