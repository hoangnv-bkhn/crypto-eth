pragma solidity ^0.5.16;

contract DappToken{
    string public name = "Akai Churippu";
    string public symbol = "ACP";
    string public standard = "Akai Churippu v1.0";
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor (uint256 _initialSupply) public {
        owner = msg.sender;
        balanceOf[owner] = _initialSupply;
        totalSupply = _initialSupply;
        emit OwnerSet(address(0), owner);
    }

    function getOwner() external view returns (address){
        return owner;
    }

    function changeOwner(address _newOwner) public isOwner{
        owner = _newOwner;
        emit OwnerSet(owner, _newOwner);
    }

    address private owner;
    bool public transferable = true;

    // events
    event Transfer(
        address indexed _from, 
        address indexed _to, 
        uint256 _value
    );

    event Approval(
        address indexed _owner, 
        address indexed _spender, 
        uint256 _value
    );

    event Burn(
        address indexed _burner,
        uint256 _value 
    );

    event OwnerSet (
        address indexed _oldOwner, 
        address indexed _newOwner
    );

    modifier isOwner(){
        require(msg.sender == owner, "Not Owner");
        _;
    }

    modifier istransferable(){
        require(transferable == true, "Can not trade");
        _;
    }

    function isTransferable(bool _choice) public isOwner{
        transferable = _choice;
    }

    function transfer(address _to, uint256 _value) public istransferable returns (bool success) {
        require(balanceOf[msg.sender] >= _value);
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(msg.sender, _to, _value);

        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success){
        allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);

        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_value <= balanceOf[_from]);
        require(_value <= allowance[_from][msg.sender]);

        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;

        allowance[_from][msg.sender] -= _value;

        emit Transfer(_from, _to, _value);
        return true;
    }

    function burn(uint256 _value) public {
        _burn(msg.sender, _value);
    }

    function _burn(address _who, uint256 _value) internal {
        require(_value <= balanceOf[_who]);
        require(_value <= totalSupply);
        balanceOf[_who] -= _value;
        totalSupply -= _value;
        emit Burn(_who, _value);
        emit Transfer(_who, address(0), _value);
    }

}




