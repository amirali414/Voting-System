// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Smart
/// @notice Smart ICO selection Platform
/// @dev See the README.md file.
contract SmartICO {
        /// @notice Voting season. A new Season begins after the winner is selected.
        uint public season;
        /// @notice A unique ID for the project.
        uint public uniqueId;
        /// @notice ether in wei.
        uint public eth;
        /// @notice The maximum ether that can be considered for the cap.
        uint public max;
        /// @notice The minimum ether that can be considered for the cap. => (%)
        uint public min;
        /// @notice Total Capital Voted in This Season.
        uint public totalValue;
        /// @notice A mapping for projects.
        mapping (uint => mapping (uint => Project)) private Projects;

        address public owner;
        /// @notice A mapping for user account balances.
        mapping (address => uint) private balances;
        /// @notice A mapping for voters.
        mapping (uint => mapping (address => Vote)) private Voters;
        enum State {
                Active,
                Win
        }
        struct Project {
                uint _season;
                uint _uniqueId;
                address _owner;
                string _title;
                uint _softCap;
                uint _capital;
                uint _votes;
                State _state;
        }
        /// @notice A list of projects.
        Project[] private ProjectsList;
        struct Vote {
                bool _status;
                uint _value;
        }
        event LogWithdraw(address _addr, uint _value);
        event LogDeposit(address _addr, uint _value);
        event LogCreated(address _addr, uint _uniqueId, uint _season, address _owner, string _title, uint _softCap);
        event LogVoted(address _addr, uint _season, uint _uniqueId, uint _capital);
        event LogPicked(address _addr, uint _season, uint _uniqueId, uint _total);
        /// @dev Only owners have access.
        modifier onlyOwner() {
                require(msg.sender == owner, "SOLIDITY: Ln: 55");
                _;
        }
        /// @dev Checks if the project is active or not.
        modifier active(uint _uniqueId) {
                require(Projects[season][_uniqueId]._state == State.Active, "SOLIDITY: Ln: 60");
                _;
        }
        /// @notice set values.
        /// @dev Some variables may change in the future.
        constructor () {
                season = 0;
                uniqueId = 0;
                eth = 1e18;
                max = 10000 * eth;
                min = 50;
                totalValue = 0;
                owner = msg.sender;
        }
        fallback () external payable {
                revert();
        }
        receive () external payable {
                revert();
        }
        /// @dev Deposit function.
        /// @return bool => true
        function deposit () public payable returns (bool) {
                balances[msg.sender] += msg.value;
                emit LogDeposit(msg.sender, msg.value);
                return true;
        }
        /// @dev Withdrawal function.
        /// @param _value The amount you intend to withdraw.
        /// @return bool => true
        function withdraw (uint _value) public payable returns (bool) {
                require(_value <= balances[msg.sender], "SOLIDITY: Ln: 95");
                balances[msg.sender] -= _value;
                payable(msg.sender).transfer(_value);
                emit LogWithdraw(msg.sender, _value);
                return true;
        }
        /// @dev A function that creates a project with a unique ID and adds it to the list and mapping.
        /// @param __title Project title.
        /// @param __softCap Project Softcap.
        /// @return bool => true
        function createProject (string memory __title, uint __softCap) public returns (bool) {
                require(ProjectsList.length <= 100, "SOLIDITY: 102");
                require((__softCap / 100) * min <= balances[msg.sender], "SOLIDITY: Ln: 103");
                require(__softCap <= max, "SOLIDITY: Ln: 104");
                //require(__softCap >= minEth);
                balances[msg.sender] -= (__softCap / 100) * min;
                Projects[season][uniqueId] = Project({
                        _season : season,
                        _uniqueId : uniqueId,
                        _owner : msg.sender,
                        _title : __title,
                        _softCap : __softCap,
                        _capital: 0,
                        _votes : 0,
                        _state : State.Active
                });
                ProjectsList.push(Projects[season][uniqueId]);
                uniqueId += 1;
                emit LogCreated(msg.sender, uniqueId - 1, season, msg.sender, __title, __softCap);
                return true;
        }
        /// @notice Project voting function.
        /// @dev The project must be open. Only the current season is considered.
        /// @param _val The amount you intend to invest.
        /// @param _uniqueId Unique ID of the project you intend to vote for.
        /// @return bool => true
        function vote (uint _val, uint _uniqueId) public returns (bool) {
                require(Projects[season][_uniqueId]._state == State.Active);
                require(Voters[season][msg.sender]._status != true);
                balances[msg.sender] -= _val;
                totalValue = totalValue + _val;
                Projects[season][_uniqueId]._votes += 1;
                Projects[season][_uniqueId]._capital += _val;
                Voters[season][msg.sender] = Vote({
                        _status : true,
                        _value : _val
                });
                emit LogVoted(msg.sender, season, _uniqueId, _val);
                return true;
        }
        /// @notice Select the winner.
        /// @dev Due to the need for many loops to decentralize this function, this centralized function is written and called by the owners.
        /// @param _uniqueId Project unique ID.
        /// @return bool => true
        function winnerSelection (uint _uniqueId) public payable onlyOwner returns (bool) {
                require(Projects[season][_uniqueId]._state == State.Active, "SOLDITY: Ln: 146");
                require(Projects[season][_uniqueId]._capital >= Projects[season][_uniqueId]._softCap, "SOLDITY: Ln: 147");
                address _to = Projects[season][_uniqueId]._owner;
                uint mem = totalValue;
                season += 1;
                uniqueId = 0;
                totalValue = 0;
                Projects[season][_uniqueId]._state = State.Win;
                payable(_to).transfer(totalValue);
                emit LogPicked(owner, season - 1, _uniqueId, mem);
                return true;
        }
        /// @notice Get data functions to communicate with the contract.
        /// @dev return list of projects for other contracts or UI.
        /// @return Porject list
        function getProjects () public view returns (Project[] memory) {
                return ProjectsList;
        }
        /// @notice Get data functions to communicate with the contract.
        /// @return balance of user
        function getBalance () public view returns (uint) {
                return balances[msg.sender];
        }
        /// @notice Get data functions to communicate with the contract.
        /// @dev Return project related to Unique ID.
        /// @param _uniqueId project unique ID
        /// @return __title : project title, __softCap : project softCap, __votes : project votes, __capital : project capital, __state : project state, __owner : project owner
        function getProject (uint _uniqueId) public view returns (string memory __title, uint __softCap, uint __votes, uint __capital, uint __state, address __owner) {
                __title = Projects[season][_uniqueId]._title;
                __softCap = Projects[season][_uniqueId]._softCap;
                __votes = Projects[season][_uniqueId]._votes;
                __capital = Projects[season][_uniqueId]._capital;
                __state = uint(Projects[season][_uniqueId]._state);
                __owner = Projects[season][_uniqueId]._owner;
                return (__title, __softCap, __votes, __capital, __state, __owner);
        }
        /// @notice Get data functions to communicate with the contract.
        /// @dev Return voter related to address.
        /// @param _addr address of voter.
        /// @return Vote
        function getVoter (address _addr) public view returns (Vote memory) {
                return Voters[season][_addr];
        }

        function changeMax (uint _newValue) public onlyOwner returns (bool) {
                max = _newValue;
                return true;
        }
        function changeMin (uint _newValue) public onlyOwner returns (bool) {
                min = _newValue;
                return true;
        }
}
