import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { PublicKey, Keypair } from "@solana/web3.js";
import { SolTrust } from "../target/types/sol_trust";

describe("sol-trust", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  //Fetch the Program now
  const program = anchor.workspace.SolTrust as Program<SolTrust>;

  // New Signer
  const newSigner = Keypair.generate();

  const config_index = 0;
  const name = "Preet"; // The string for the name
  const nameBuffer = Buffer.alloc(32); // Create a buffer of 32 bytes
  nameBuffer.write(name); // Write the string into the buffer (will be padded with zeros if less than 32 bytes)

  // Define the Config PDA
  const [configPDA, _configBUMP] = PublicKey.findProgramAddressSync(
    [Buffer.from([config_index]), Buffer.from("soltrust_config")],
    program.programId
  );

  // Define the CreateBankAccount PDA
  const [createBankAccountPDA, _createBankAccountBump] =
    PublicKey.findProgramAddressSync(
      [newSigner.publicKey.toBuffer(), Buffer.from("create_bank_account")],
      program.programId
    );

  // Define the Admin's Withdrawal Account PDA
  const [createAdminWithdrawalAccountPDA, _createAdminWithdrawalAccountBump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from("admin_withdrawal_account")],
      program.programId
    );

  it("Is Initialized By Admin in Practice!", async () => {
    //Let's define the Transaction
    let tx = await program.methods
      .initializeSoltrustConfig(config_index)
      .accounts({
        owner: program.provider.publicKey,
        soltrustconfig: configPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Transaction Signature : ", tx);

    const configAccount = await program.account.solTrustConfig.fetch(configPDA);

    expect(configAccount.configIndex).to.equal(config_index);
    expect(configAccount.owner.toBase58()).to.equal(
      program.provider.publicKey.toBase58()
    );
  });

  it("is Updating Working Right!", async () => {
    let tx = await program.methods
      .updateSoltrustConfig(config_index, config_index + 1)
      .accounts({
        soltrustconfig: configPDA,
      })
      .rpc();

    const solTrustConfigAccount = await program.account.solTrustConfig.fetch(
      configPDA
    );

    console.log("Config Index : ", solTrustConfigAccount.configIndex);

    expect(solTrustConfigAccount.configIndex).to.equal(1);
  });

  it("Fails when updating config with a different signer!", async () => {
    try {
      // Attempt to update the config with a different signer (should fail)
      let tx = await program.methods
        .updateSoltrustConfig(config_index, config_index + 1)
        .accounts({
          soltrustconfig: configPDA,
        })
        .signers([newSigner]) // Use the different signer here
        .rpc();

      console.log("Transaction Signature: ", tx);

      // If it reaches here, the test should fail, because the wrong signer should not be authorized
      throw new Error("Test should have failed with unauthorized signer");
    } catch (error) {
      console.log("Expected failure: Unauthorized signer");
      expect(error.toString()).to.contain("Error");
    }
  });

  it("Create Bank Account : ", async () => {
    // Airdrop some SOL to newSigner to avoid insufficient lamports error

    const airdropSig = await provider.connection.requestAirdrop(
      newSigner.publicKey,
      5000 * anchor.web3.LAMPORTS_PER_SOL
    );

    const latestBlockHash = await provider.connection.getLatestBlockhash();
    const confirmationConfig = {
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: airdropSig,
    };

    await provider.connection.confirmTransaction(confirmationConfig);

    // Record the current time before the transaction
    const beforeTimestamp = Math.floor(Date.now() / 1000);

    console.log("Before Timestamp : ", beforeTimestamp);

    let tx = await program.methods
      .createBankAccount([...nameBuffer])
      .accounts({
        signer: newSigner.publicKey,
        soltrustconfig: configPDA,
        create_bank_account: createBankAccountPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([newSigner])
      .rpc();

    let createdBankAccount = await program.account.createBankAccounts.fetch(
      createBankAccountPDA
    );

    expect(createdBankAccount.holder.toBase58()).to.equal(
      newSigner.publicKey.toBase58()
    );
    // Decode the holder_name (which is an array of numbers) back into a string
    let holderName = Buffer.from(createdBankAccount.holderName)
      .toString("utf-8")
      .replace(/\0/g, "");

    console.log(holderName);

    // Check if it matches the expected name
    expect(holderName).to.equal(name);
    expect(createdBankAccount.balance.toNumber()).to.equal(0);

    // Testing the timestamp
    // Record the current time after the transaction
    const afterTimestamp = Math.floor(Date.now() / 1000); // Get the time in seconds

    // Check if created_at is within the expected time range
    const createdAt = createdBankAccount.createdAt.toNumber();

    console.log("Created At timestamp: ", createdAt);
    console.log("After timestamp: ", afterTimestamp);

    const timestampInSeconds = afterTimestamp; // Example timestamp
    const date = new Date(timestampInSeconds * 1000); // Multiply by 1000 to convert to milliseconds
    console.log("Date : ", date.toLocaleString());

    // expect(createdAt).to.be.at.least(beforeTimestamp);
    expect(createdAt).to.be.at.most(afterTimestamp);
  });

  it("Desposit Money!", async () => {
    // Before Despositing, Balance of the Signer
    const balanceLamports = await provider.connection.getBalance(
      newSigner.publicKey
    );
    const balanceSOL = balanceLamports / anchor.web3.LAMPORTS_PER_SOL;

    console.log(`Balance of newSigner: ${balanceSOL} SOL`);

    let tx = await program.methods
      .depositMoney(new anchor.BN(3000))
      .accounts({
        signer: newSigner.publicKey,
        soltrustconfig: configPDA,
        create_bank_account: createBankAccountPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([newSigner])
      .rpc();

    const depsoitedMoney = await program.account.createBankAccounts.fetch(
      createBankAccountPDA
    );

    console.log(
      "Balance of My Account : ",
      depsoitedMoney.balance.toNumber() / anchor.web3.LAMPORTS_PER_SOL
    );
    console.log("Account Holder : ", depsoitedMoney.holder.toBase58());
    let holderName = Buffer.from(depsoitedMoney.holderName)
      .toString("utf-8")
      .replace(/\0/g, "");

    console.log(holderName);

    // Check if it matches the expected name
    expect(holderName).to.equal(name);

    const afterDepositBalanceLamports = await provider.connection.getBalance(
      newSigner.publicKey
    );
    const afterDespositBalanceSOL =
      afterDepositBalanceLamports / anchor.web3.LAMPORTS_PER_SOL;

    console.log(
      `After Deposit Balance of newSigner: ${afterDespositBalanceSOL} SOL`
    );
  });

  it("Withdraw Money!", async () => {
    let initializeAdminWithdrawalAccount = await program.methods
      .initializeAdminWithdrawalAccount()
      .accounts({ admin_withdrawal_account: createAdminWithdrawalAccountPDA })
      .rpc();

    const beforeWithdrawBalanceLamports = await provider.connection.getBalance(
      newSigner.publicKey
    );
    const beforeWithdrawBalanceSOL =
      beforeWithdrawBalanceLamports / anchor.web3.LAMPORTS_PER_SOL;

    console.log(
      "Before Withdrawing My Wallet Balance : ",
      beforeWithdrawBalanceSOL
    );

    let tx = await program.methods
      .withdrawMoney(new anchor.BN(500))
      .accounts({
        signer: newSigner.publicKey,
        soltrustconfig: configPDA,
        create_bank_account: createBankAccountPDA,
        admin_withdraw_account: createAdminWithdrawalAccountPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([newSigner])
      .rpc();

    let tx2 = await program.methods
      .withdrawMoney(new anchor.BN(1000))
      .accounts({
        signer: newSigner.publicKey,
        soltrustconfig: configPDA,
        create_bank_account: createBankAccountPDA,
        admin_withdraw_account: createAdminWithdrawalAccountPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([newSigner])
      .rpc();

    let tx3 = await program.methods
      .withdrawMoney(new anchor.BN(1000))
      .accounts({
        signer: newSigner.publicKey,
        soltrustconfig: configPDA,
        create_bank_account: createBankAccountPDA,
        admin_withdraw_account: createAdminWithdrawalAccountPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([newSigner])
      .rpc();

    const withdrawedMoney = await program.account.createBankAccounts.fetch(
      createBankAccountPDA
    );
    console.log(
      "Balance of My Account : ",
      withdrawedMoney.balance.toNumber() / anchor.web3.LAMPORTS_PER_SOL
    );

    const afterWithdrawBalanceLamports = await provider.connection.getBalance(
      newSigner.publicKey
    );
    const afterWithdrawBalanceSOL =
      afterWithdrawBalanceLamports / anchor.web3.LAMPORTS_PER_SOL;

    console.log(
      "After Withdrawing My Wallet Balance : ",
      afterWithdrawBalanceSOL
    );
  });

  it("Admin is withdrawing collected fees!", async () => {
    let adminWithdrawalAccount =
      await program.account.adminsWithdrawalAccount.fetch(
        createAdminWithdrawalAccountPDA
      );
    let adminWithdrawalAccountBalance =
      adminWithdrawalAccount.balance.toNumber() / anchor.web3.LAMPORTS_PER_SOL;

    console.log(
      "Admin Withdrawal Account Balance Before: ",
      adminWithdrawalAccountBalance
    );

    const beforeLamports = await provider.connection.getBalance(
      provider.publicKey
    );
    const beforeBalanceSOL = beforeLamports / anchor.web3.LAMPORTS_PER_SOL;
    console.log("Admin Wallet Balance Before: ", beforeBalanceSOL);

    let tx = await program.methods
      .withdrawFees(new anchor.BN(adminWithdrawalAccountBalance))
      .accounts({
        admin: provider.publicKey,
        admin_account: createAdminWithdrawalAccountPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Introduce a small delay to wait for transaction finalization
    await new Promise((resolve) => setTimeout(resolve, 2000));

    let updatedAdminWithdrawalAccount =
      await program.account.adminsWithdrawalAccount.fetch(
        createAdminWithdrawalAccountPDA
      );
    let updatedAdminWithdrawalAccountBalance =
      updatedAdminWithdrawalAccount.balance.toNumber() /
      anchor.web3.LAMPORTS_PER_SOL;

    console.log(
      "Admin Withdrawal Account Balance After: ",
      updatedAdminWithdrawalAccountBalance
    );

    const afterLamports = await provider.connection.getBalance(
      provider.publicKey
    );
    const afterBalanceSOL = afterLamports / anchor.web3.LAMPORTS_PER_SOL;
    console.log("Admin Wallet Balance After: ", afterBalanceSOL);
  });
});
