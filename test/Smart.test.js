const SmartICO = artifacts.require('SmartICO');
// test smart ico
contract("Smart", accounts => {
        var con;
        const emptyAddress = '0x0000000000000000000000000000000000000000';
        var eth1 = web3.utils.toBN(1);
        var eth10 = web3.utils.toBN(10);
        var eth100 = web3.utils.toBN(100);
        var [alice, bob, emma] = accounts;
        before(async () => {
                con = await SmartICO.new();
        });
        it("Ready", async () => {
                assert.equal(
                        await web3.eth.getBalance(emma),
                        100e18.toString()
                );
        });
        describe("variables", async () => {
                it("owner by owner", async () => {
                        assert.equal(
                                await con.owner.call(),
                                alice
                        );
                });
                it("season", async () => {
                        assert.equal(
                                typeof con.season,
                                'function'
                        );
                });
                it("uniqueId", async () => {
                        assert.equal(
                                typeof con.uniqueId,
                                'function'
                        );
                });
                it("totalValue", async () => {
                        assert.equal(
                                typeof con.totalValue,
                                'function'
                        );
                });
                it("maximum", async () => {
                        assert.equal(
                                typeof con.min,
                                'function'
                        );
                });
                it("maximum", async () => {
                        assert.equal(
                                typeof con.max,
                                'function'
                        );
                });
        });
        describe("Enums", async () => {
                describe("State enum", async () => {
                        var enumState;
                        before(() => {
                                enumState = SmartICO.enums.State;
                                assert(
                                        enumState,
                                        "The contract should define an Enum called State"
                                );
                        });
                        it("should define `Active`", async () => {
                                assert(
                                        enumState.hasOwnProperty('Active'),
                                        "The enum does not have a `Active` value"
                                );
                        });
                        it("should define `Win`", async () => {
                                assert(
                                        enumState.hasOwnProperty('Win'),
                                        "The enum does not have a `Win` value"
                                );
                        });
                });
        });
        describe("deposit", async () => {
                it("should deposit correct amount", async () => {
                        await con.deposit({
                                from: alice,
                                value: eth1
                        });
                        var balance = await con.getBalance.call({
                                from: alice
                        });
                        assert.equal(
                                eth1.toString(),
                                balance
                        );
                });
                it("should log a deposit event when a deposit is made", async () => {
                        const result = await con.deposit({
                                from: alice,
                                value: eth1
                        });
                        const expectedEventResult = {
                                _addr: alice,
                                _value: eth1
                        };
                        const addr = result.logs[0].args._addr;
                        const value = result.logs[0].args._value.toString();
                        assert.equal(
                                addr,
                                expectedEventResult._addr
                        );
                        assert.equal(
                                value,
                                expectedEventResult._value
                        );
                });
        });
        describe("withdraw", async () => {
                it("should withdraw correct amount", async () => {
                        await con.withdraw(eth1, {
                                from: alice
                        });
                        var balance = await con.getBalance.call({
                                from: alice
                        });
                        assert.equal(
                                balance,
                                web3.utils.toBN(1).toString()
                        );
                });
                it("should not be able to withdraw more than has been deposited", async () => {
                        var status;
                        try{
                                await con.withdraw(eth1 + 1, {
                                        from: alice
                                });
                                status = true;
                        }catch{
                                status = false;
                        }
                        assert.equal(status, false);
                });
                it("should emit the appropriate event when a withdrawal is made", async () => {
                        var result = await con.withdraw(eth1, {
                                from: alice
                        });
                        const addr = result.logs[0].args._addr;
                        const value = result.logs[0].args._value.toNumber();
                        const expectedEventResult = {
                                _addr: alice,
                                _value: eth1
                        };
                        assert.equal(
                                expectedEventResult._addr,
                                addr
                        );
                        assert.equal(
                                expectedEventResult._value,
                                value
                        );
                });
        });
        describe("functions", async () => {
                describe("Create project", async () => {
                        it("Create a new project and check access to it", async () => {
                                await con.deposit({ //To create a project, deposit 10 ethers.
                                        from: alice,
                                        value: eth10
                                });
                                await con.createProject("test1", web3.utils.toBN(10), {
                                        from: alice
                                });
                                const result = await con.getProject.call(0);
                                assert.equal(
                                        // title
                                        result[0],
                                        "test1"
                                );
                                assert.equal(
                                        // softCap
                                        result[1],
                                        10
                                );
                                assert.equal(
                                        // votes
                                        result[2],
                                        0
                                );
                                assert.equal(
                                        // capital
                                        result[3],
                                        0
                                );
                                assert.equal(
                                        // state
                                        SmartICO.State.Active,
                                        result[4].toString(10)
                                );
                                assert.equal(
                                        // owner
                                        result[5],
                                        alice
                                );
                        });
                        it("Access to a project that does not exist", async () => {
                                const result = await con.getProject.call(99);
                                var owner = result[5];
                                var status;
                                if(owner == emptyAddress){
                                        status = false;
                                }else{
                                        status = true
                                }
                                assert.equal(
                                        status,
                                        false
                                );
                        });
                        it("Payment of bail", async () => {
                                var status;
                                try{
                                        await con.createProject("test2", web3.utils.toBN(10e19), {
                                                from: alice
                                        });
                                        status = true;
                                }catch{
                                        status = false;
                                }
                                assert.equal(
                                        status,
                                        false
                                );
                        });
                });
                describe("Vote", async () => {
                        it("Access to the project", async () => {
                                var result = await con.getProject.call(0);
                                assert.equal(
                                        result[0],
                                        "test1"
                                );
                        });
                        describe("Voting from `alice`", async () => {
                                it("Voting", async () => {
                                        await con.deposit({
                                                from: alice,
                                                value: web3.utils.toBN(1e19)
                                        });
                                        await con.vote(web3.utils.toBN(1e18), 0, {
                                                from: alice
                                        });
                                });
                                it("Check votes", async () => {
                                        var result = await con.getProject.call(0);
                                        assert.equal(
                                                result[2],
                                                1
                                        );
                                });
                                it("Check capital", async () => {
                                        var result = await con.getProject.call(0);
                                        assert.equal(
                                                result[3],
                                                1e18
                                        );
                                });
                        });
                        describe("Voting from `bob`", async () => {
                                it("Voting", async () => {
                                        await con.deposit({
                                                from: bob,
                                                value: web3.utils.toBN(1e19)
                                        });
                                        await con.vote(web3.utils.toBN(1e18), 0, {
                                                from: bob
                                        });
                                });
                                it("Check votes", async () => {
                                        var result = await con.getProject.call(0);
                                        assert.equal(
                                                result[2],
                                                2
                                        );
                                });
                                it("Check capital", async () => {
                                        var result = await con.getProject.call(0);
                                        assert.equal(
                                                result[3],
                                                2e18
                                        );
                                });
                                it("Check totalValue", async () => {
                                        var total = await con.totalValue.call({
                                                from: alice
                                        });
                                        assert.equal(
                                                total.toString(),
                                                2e18.toString()
                                        );
                                });
                        });
                });
                describe("Winner selection", async () => {
                        var result2;
                        var address;
                        var season;
                        var uniqueId;
                        var total;
                        var expectedEventResult;
                        before(() => {
                                expectedEventResult = {
                                        _addr: alice,
                                        _season: 0,
                                        _uniqueId: 0,
                                        _total: 2e18
                                };
                        });
                        it("Only Owner has access to this function", async () => {
                                var status = false;
                                try{
                                        await con.winnerSelection(0,{
                                                from: bob
                                        });
                                }catch{
                                        status = true;
                                }
                                assert.equal(
                                        status,
                                        true
                                );
                        });
                        it("Winner Selection tx", async () => {
                                result2 = await con.winnerSelection(0, {
                                        from: alice
                                });

                        });
                        describe("Win function emit", async () => {
                                before(() => {
                                        address = result2.logs[0].args._addr;
                                        season = result2.logs[0].args._season;
                                        uniqueId = result2.logs[0].args._uniqueId;
                                        total = result2.logs[0].args._total;
                                });
                                it("winnerSelection emit `_addr`", async () => {
                                        assert.equal(
                                                address,
                                                expectedEventResult._addr
                                        );
                                });
                                it("winnerSelection emit `_season`", async () => {
                                        assert.equal(
                                                season,
                                                expectedEventResult._season
                                        );
                                });
                                it("winnerSelection emit `_uniqueId`", async () => {
                                        assert.equal(
                                                uniqueId,
                                                expectedEventResult._uniqueId
                                        );
                                });
                                it("winnerSelection emit `_total`", async () => {
                                        assert.equal(
                                                total,
                                                expectedEventResult._total
                                        );
                                });
                        });
                        describe("Check variables", async () => {
                                it("variable `season`", async () => {
                                        var result = await con.season.call({
                                                from: alice
                                        });
                                        assert.equal(
                                                result.toString(),
                                                "1"
                                        );
                                });
                                it("variable `uniqueId`", async () => {
                                        var result = await con.uniqueId.call({
                                                from: alice
                                        });
                                        assert.equal(
                                                result.toString(),
                                                "0"
                                        );
                                });
                                it("variable `totalValue`", async () => {
                                        var result = await con.season.call({
                                                from: alice
                                        });
                                        assert.equal(
                                                result.toString(),
                                                "1"
                                        );
                                });
                        });
                });
        });
});
