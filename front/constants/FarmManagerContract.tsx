export const FARM_MANAGER_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "farmAddress",
        "type": "address"
      }
    ],
    "name": "FarmAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "farmAddress",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "depositToken",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "farmType",
        "type": "uint8"
      }
    ],
    "name": "FarmUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "_isActive",
        "type": "bool"
      },
      {
        "internalType": "uint16",
        "name": "_rewardRate",
        "type": "uint16"
      },
      {
        "internalType": "uint8",
        "name": "_farmType",
        "type": "uint8"
      },
      {
        "internalType": "address",
        "name": "_farmAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_depositToken",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_rewardToken",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "_depositFunction",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_withdrawFunction",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_claimFunction",
        "type": "string"
      }
    ],
    "name": "addFarm",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_farmAddress",
        "type": "address"
      }
    ],
    "name": "getFarmInfo",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "farmAddress",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "depositToken",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "rewardToken",
            "type": "address"
          },
          {
            "internalType": "bytes4",
            "name": "depositSelector",
            "type": "bytes4"
          },
          {
            "internalType": "bytes4",
            "name": "withdrawSelector",
            "type": "bytes4"
          },
          {
            "internalType": "bytes4",
            "name": "claimSelector",
            "type": "bytes4"
          },
          {
            "internalType": "uint8",
            "name": "farmType",
            "type": "uint8"
          },
          {
            "internalType": "uint16",
            "name": "rewardRate",
            "type": "uint16"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "internalType": "struct FarmManager.FarmInfo",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_farmAddress",
        "type": "address"
      },
      {
        "components": [
          {
            "internalType": "address",
            "name": "farmAddress",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "depositToken",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "rewardToken",
            "type": "address"
          },
          {
            "internalType": "bytes4",
            "name": "depositSelector",
            "type": "bytes4"
          },
          {
            "internalType": "bytes4",
            "name": "withdrawSelector",
            "type": "bytes4"
          },
          {
            "internalType": "bytes4",
            "name": "claimSelector",
            "type": "bytes4"
          },
          {
            "internalType": "uint8",
            "name": "farmType",
            "type": "uint8"
          },
          {
            "internalType": "uint16",
            "name": "rewardRate",
            "type": "uint16"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "internalType": "struct FarmManager.FarmInfo",
        "name": "_farmInfo",
        "type": "tuple"
      }
    ],
    "name": "setFarmInfo",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
export const FARM_MANAGER_ADDRESS = "0xa1349ee08c3b3a8dc79b22891423968f48cd443c"