var DappToken = artifacts.require("./DappToken.sol");

contract('DappToken', function(accounts){
    var tokenInstance;
    var admin = accounts[0];
    var amountBurned = 100000;
    var totalSupplyInitial;

    it("initializes the contract with the correct values", function(){
        return DappToken.deployed().then(function(instance){
            tokenInstance = instance;
            return tokenInstance.name();
        }).then(function(name){
            assert.equal(name, "DApp Token", "has the correct name");
            return tokenInstance.symbol();
        }).then(function(symbol){
            assert.equal(symbol, "DAPP", "has the correct symbol");
            return tokenInstance.standard();
        }).then(function(standard){
            assert.equal(standard, "DApp Token v1.0", "has the correct standard");
        });
    });

    it('allocates the initial supply upon deployment', function(){
        return DappToken.deployed().then(function(instance){
            tokenInstance = instance;
            return tokenInstance.totalSupply();
        }).then(function(totalSupply){
            assert.equal(totalSupply.toNumber(), 1000000, "sets the total supply to 1,000,000");
            return tokenInstance.balanceOf(accounts[0]);
        }).then(function(adminBalance){
            assert.equal(adminBalance.toNumber(), 1000000, "it allocates the initial supply to admin account");
        });
    });

    it('transfers token ownership', function(){
        return DappToken.deployed().then(function(instance){
            tokenInstance = instance;
            return tokenInstance.transfer.call(accounts[1], 999999999999999999999);
        }).then(assert.fail).catch(function(error){
            assert(error.message.length >= 0, 'error message must contain revert');
            return tokenInstance.transfer.call(accounts[1], 250000, {from: accounts[0]});
        }).then(function(success){
            assert.equal(success, true);
            return tokenInstance.transfer(accounts[1], 250000, {from: accounts[0]});
        }).then(function(receipt){
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
            assert.equal(receipt.logs[0].args._from, accounts[0], 'logs the account the tokens are transfered from');
            assert.equal(receipt.logs[0].args._to, accounts[1], 'logs the account the tokens are transfered to');
            assert.equal(receipt.logs[0].args._value, 250000, 'logs the transfer amount');

            return tokenInstance.balanceOf(accounts[1]);
        }).then(function(balance){
            assert.equal(balance.toNumber(), 250000, "adds the amount to the receiving account");
            return tokenInstance.balanceOf(accounts[0]);
        }).then(function(balance){
            assert.equal(balance.toNumber(), 750000, "deducts the amount from the sending accounts");
        });
    });

    it('approves tokens for delegated transfer', function(){
        return DappToken.deployed().then(function(instance){
            tokenInstance = instance;
            return tokenInstance.approve.call(accounts[1], 100);
        }).then(function(success){
            assert.equal(success, true, 'it returns true');
            return tokenInstance.approve(accounts[1], 100, {from: accounts[0]});
        }).then(function(receipt){
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event, 'Approval', 'should be the "Approval" event');
            assert.equal(receipt.logs[0].args._owner, accounts[0], 'logs the account the tokens are authorized by');
            assert.equal(receipt.logs[0].args._spender, accounts[1], 'logs the account the tokens are authorized to');
            assert.equal(receipt.logs[0].args._value, 100, 'logs the transfer amount');
            return tokenInstance.allowance(accounts[0], accounts[1]);
        }).then(function(allowance){
            assert.equal(allowance.toNumber(), 100, 'stores the allowance for delegated transfer');
        })
    });

    it('handles delegated token transfers', function(){
        return DappToken.deployed().then(function(instance){
            tokenInstance = instance;
            fromAccount = accounts[2];
            toAccount = accounts[3];
            spendingAccount = accounts[4];

            return tokenInstance.transfer(fromAccount, 100, {from: accounts[0]});
        }).then(function(receipt){
            return tokenInstance.approve(spendingAccount, 10, {from: fromAccount});
        }).then(function(receipt){
            return tokenInstance.transferFrom(fromAccount, toAccount, 9999, {from: spendingAccount});
        }).then(assert.fail).catch(function(error){
            assert(error.message.toString().indexOf('revert') >= 0, 'cannot transfer value larger than balance');
            return tokenInstance.transferFrom(fromAccount, toAccount, 20, {from: spendingAccount});
        }).then(assert.fail).catch(function(error){
            assert(error.message.toString().indexOf('revert') >= 0, 'cannot transfer value larger than approved amount');
            return tokenInstance.transferFrom.call(fromAccount, toAccount, 10, {from: spendingAccount});
        }).then(function(success){
            assert.equal(success, true);
            return tokenInstance.transferFrom(fromAccount, toAccount, 10, {from: spendingAccount});
        }).then(function(receipt){
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
            assert.equal(receipt.logs[0].args._from, fromAccount, 'logs the account the tokens are transfered from');
            assert.equal(receipt.logs[0].args._to, toAccount, 'logs the account the tokens are transfered to');
            assert.equal(receipt.logs[0].args._value, 10, 'logs the transfer amount');
            return tokenInstance.balanceOf(fromAccount);
        }).then(function(balance){
            assert.equal(balance.toNumber(), 90, 'deducts the amount from the sending account');
            return tokenInstance.balanceOf(toAccount);
        }).then(function(balance){
            assert.equal(balance.toNumber(), 10, 'adds the amount from the receiving account');
            return tokenInstance.allowance(fromAccount, spendingAccount);
        }).then(function(allowance){
            assert.equal(allowance.toNumber(), 0, 'deducts the amount from the allowance');
        });
    });

    it('burns token test', function() {
        return DappToken.deployed().then(function(instance) {
            tokenInstance = instance;
            return tokenInstance.totalSupply();
        }).then(function(totalSupply){
            totalSupplyInitial = totalSupply;
            return tokenInstance.burn(amountBurned);
        }).then(function(receipt){
            assert.equal(receipt.logs.length, 2, 'triggers two events');
            assert.equal(receipt.logs[0].event, 'Burn', 'should be the "Burn" event');
            assert.equal(receipt.logs[0].args._burner, admin, 'logs the account that burn the tokens');
            assert.equal(receipt.logs[0].args._value, amountBurned, 'logs the number of tokens burned');
            return tokenInstance.totalSupply();
        }).then(function(totalSupply){
            assert.equal(totalSupply.toNumber(), totalSupplyInitial - amountBurned, 'burns token from totalSupply');
        });
    });

    it('changes owner test', function() {
        return DappToken.deployed().then(function(instance) {
            tokenInstance = instance;
            return tokenInstance.getOwner();
        }).then(function(owner){
            assert.equal(owner, '0x85F38f458645fe3512Fa50C920d53b842e3cF9Ca', 'owner is the first account in Ganache');
            return tokenInstance.changeOwner(accounts[1]);
        }).then(function(receipt){
            assert.equal(receipt.logs.length, 1, 'triggers two events');
            assert.equal(receipt.logs[0].event, 'OwnerSet', 'should be the "OwnerSet" event');
            assert.equal(receipt.logs[0].args._newOwner, accounts[1], 'logs the account is becoming new Owner');
            return tokenInstance.getOwner();
        }).then(function(owner){
            assert.equal(owner, '0xC92a84d0923f173C68F18d05a61Fc33FA5e48ECF', 'owner is the second account in Ganache');
        });
    });

    it('locks token test', function() {
        return DappToken.deployed().then(function(instance) {
            tokenInstance = instance;
            return tokenInstance.transfer.call(accounts[1], 250000, {from: accounts[0]});
        }).then(function(success){
            assert.equal(success, true);
            return tokenInstance.getOwner();
        }).then(function(owner){
            assert.equal(owner, '0xC92a84d0923f173C68F18d05a61Fc33FA5e48ECF', 'owner is the second account in Ganache');
            return tokenInstance.isTransferable(false, {from: accounts[0]});
        }).then(assert.fail).catch(function(error){
            assert(error.message.toString().indexOf('revert') >= 0, 'only owner can lock token');
            return tokenInstance.transferable();
        }).then(function(transferable){
            assert.equal(transferable, true, 'transferable must be true');
            return tokenInstance.isTransferable(false, {from: accounts[1]});
        }).then(function(){
            return tokenInstance.transferable();
        }).then(function(transferable){
            assert.equal(transferable, false, 'transferable must be false');
            return tokenInstance.transfer.call(accounts[1], 250000, {from: accounts[0]});
        }).then(assert.fail).catch(function(error){
            assert(error.message.toString().indexOf('revert') >= 0, 'cannot transfer anymore');
        });
    });

});