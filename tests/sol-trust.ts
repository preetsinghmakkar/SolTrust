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

    const [configPDA, _bump] = await PublicKey.findProgramAddress(
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

    const [configPDA, _bump] = await PublicKey.findProgramAddress(
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

    const [configPDA, _bump] = await PublicKey.findProgramAddress(
      [Buffer.from([configIndex]), Buffer.from("soltrust_config")], // Your seed logic
      program.programId
    );

    const nameBuffer = Buffer.from(name, "utf-8");

    const [createBankAccountPDA, _createBankAccountBump] =
      await PublicKey.findProgramAddress(
        [Buffer.from(name), Buffer.from("create_bank_account")], // Seed logic for the bank account
        program.programId
      );

    const tx = await program.methods
      .createBankAccount(name)
      .accounts({
        signer: provider.wallet.publicKey, // Use wallet public key as signer
        soltrustconfig: configPDA,
        create_bank_account: createBankAccountPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const createBankAccount = await program.account.createBankAccounts.fetch(
      createBankAccountPDA
    );

    console.log("Balance of Preet :", createBankAccount.balance);

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

    const [configPDA, _bump] = await PublicKey.findProgramAddress(
      [Buffer.from([configIndex]), Buffer.from("soltrust_config")], // Your seed logic
      program.programId
    );

    const nameBuffer = Buffer.from(name, "utf-8");

    const [createBankAccountPDA, _createBankAccountBump] =
      await PublicKey.findProgramAddress(
        [Buffer.from(name), Buffer.from("create_bank_account")], // Seed logic for the bank account
        program.programId
      );

    const tx = await program.methods
      .depositMoney(new anchor.BN(amount), name)
      .accounts({
        signer: provider.wallet.publicKey, // Use wallet public key as signer
        soltrustconfig: configPDA,
        create_bank_account: createBankAccountPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Deposit Money : ", tx);

    // const createBankAccount = await program.account.createBankAccounts.fetch(
    //   createBankAccountPDA
    // );

    // console.log("Balance of Preet :", createBankAccount.balance);

    // // Expect statement for holder (public key)
    // expect(createBankAccount.holder.toBase58()).to.equal(
    //   provider.wallet.publicKey.toBase58()
    // );

    // // Expect statement for balance (initialized to 0)
    // expect(createBankAccount.balance.toString()).to.equal(
    //   new anchor.BN(1000).toString()
    // );

    // // Expect statement for holder_name (should be "Preet")
    // expect(createBankAccount.holderName).to.equal(name);

    // // Get the current timestamp for comparison
    // const currentSlot = await provider.connection.getSlot();
    // const clock = await provider.connection.getBlockTime(currentSlot);

    // // Expect statement for created_at (timestamp)
    // expect(Number(createBankAccount.createdAt)).to.be.closeTo(clock, 5); // Allow a 5-second tolerance
  });
});
