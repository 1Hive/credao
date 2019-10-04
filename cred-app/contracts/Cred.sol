pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/lib/ens/AbstractENS.sol";
import "@aragon/os/contracts/lib/ens/PublicResolver.sol";

import "@aragon/apps-token-manager/contracts/TokenManager.sol";

contract Cred is AragonApp {

    struct Distribution {
      bytes32 root;
      string dataURI;
      mapping(address => bool) received;
    }

    /// Events
    event Start(uint id);
    event Award(uint id, address recipient, uint amount);

    /// State
    mapping(uint => Distribution) public distributions;
    /* mapping(address => uint) public lastClaimed; */
    TokenManager public tokenManager;
    uint public distributionsCount;
    string public source;

    /// ACL
    bytes32 constant public START_ROLE = keccak256("START_ROLE");
    bytes32 constant public CHANGE_SOURCE = keccak256("CHANGE_SOURCE");

    // Errors
    string private constant ERROR = "ERROR";
    string private constant ERROR_PERMISSION = "PERMISSION";
    string private constant ERROR_NOT_FOUND = "NOT_FOUND";
    string private constant ERROR_INVALID = "INVALID";

    function initialize(
      address _tokenManager, string _source
    ) onlyInit public {
        initialized();

        tokenManager = TokenManager(_tokenManager);
        source = _source;
    }

    /**
     * @notice Start a new distribution `_root` / `_dataURI`
     * @param _root New distribution merkle root
     * @param _dataURI Data URI for distribution data
     */
    function start(bytes32 _root, string _dataURI) auth(START_ROLE) public {
        _start(_root, _dataURI);
    }

    function _start(bytes32 _root, string _dataURI) internal returns(uint id){
        id = ++distributionsCount;    // start at 1
        distributions[id] = Distribution(_root, _dataURI);
        emit Start(id);
    }

    /**
     * @notice Set source to `_source`
     * @param _source New source
     */
    function setSource(string _source) auth(CHANGE_SOURCE) public {
        source = _source;
    }

    /**
     * @notice Award from distribution
     * @param _id Distribution id
     * @param _recipient Airdrop recipient
     * @param _amount The token amount
     * @param _proof Merkle proof to correspond to data supplied
     */
    function award(uint _id, address _recipient, uint256 _amount, bytes32[] _proof) public {
        Distribution storage distribution = distributions[_id];

        bytes32 hash = keccak256(_recipient, _amount);
        require( validate(distribution.root, _proof, hash), ERROR_INVALID );

        /* require( _id > lastClaimed[_recipient], ERROR_PERMISSION ); */
        require( !distributions[_id].received[_recipient], ERROR_PERMISSION );

        /* lastClaimed[_recipient] = _id; */
        distributions[_id].received[_recipient] = true;

        tokenManager.mint(_recipient, _amount);

        emit Award(_id, _recipient, _amount);
    }

    function extractProof(bytes _proofs, uint _marker, uint proofLength) public pure returns (bytes32[] proof) {

        proof = new bytes32[](proofLength);

        bytes32 el;

        for (uint j = 0; j < proofLength; j++) {
            assembly {
                el := mload(add(_proofs, _marker))
            }
            proof[j] = el;
            _marker += 32;
        }

    }

    function validate(bytes32 root, bytes32[] proof, bytes32 hash) public pure returns (bool) {

        for (uint i = 0; i < proof.length; i++) {
            if (hash < proof[i]) {
                hash = keccak256(hash, proof[i]);
            } else {
                hash = keccak256(proof[i], hash);
            }
        }

        return hash == root;
    }

    /**
     * @notice Check if recipient:`_recipient` received from distribution:`_id`
     * @param _id Distribution id
     * @param _recipient Recipient to check
     */
    function awarded(uint _id, address _recipient) public view returns(bool) {
        /* return _id <= lastClaimed[_recipient]; */
        return distributions[_id].received[_recipient];
    }

    function bytes32ToBytes(bytes32 data) public pure returns (bytes result) {
        uint len = 0;
        while (len < 32 && uint(data[len]) != 0) {
            ++len;
        }

        assembly {
            result := mload(0x40)
            mstore(0x40, add(result, and(add(add(len, 0x20), 0x1f), not(0x1f))))
            mstore(result, len)
            mstore(add(result, 0x20), data)
        }
    }
}
