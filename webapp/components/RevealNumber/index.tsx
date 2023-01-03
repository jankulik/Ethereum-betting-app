import { useStyles } from './styles';
import { IconX, IconCheck } from '@tabler/icons';
import { Button } from '@mantine/core';
import detectEthereumProvider from '@metamask/detect-provider';
import blockchainnet from '../../blockchainnet.json';
import contracts from '../../contracts.json';
import { AbiItem } from 'web3-utils'
import Web3 from 'web3';
import { showNotification } from '@mantine/notifications';

interface RevealNumberProps {
  betId: string,
  user: string,
}

export default function RevealNumber({ betId, user }: RevealNumberProps) {
  const { classes, cx } = useStyles();

  const Testnet = blockchainnet.Testnet;
  const TestnetRpc = blockchainnet.TestnetRpc;

  const web3 = new Web3((Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc));
  const BetNumber = new web3.eth.Contract(contracts.BetNumber.abi as unknown as AbiItem, contracts.BetNumber.address);
  const ascii85 = require('ascii85');

  async function decryptData(account: string, data: Buffer): Promise<Buffer> {
    const structuredData = {
      version: 'x25519-xsalsa20-poly1305',
      ephemPublicKey: data.slice(0, 32).toString('base64'),
      nonce: data.slice(32, 56).toString('base64'),
      ciphertext: data.slice(56).toString('base64'),
    };

    const ct = `0x${Buffer.from(JSON.stringify(structuredData), 'utf8').toString('hex')}`;

    const decrypt = await window.ethereum?.request({
      method: 'eth_decrypt',
      params: [ct, account],
    });

    return ascii85.decode(decrypt).toString();
  }

  const getEncryptedData = async () => {
    try {
      return await BetNumber.methods.getEncryptedData(betId).call();
    } catch {
      return false;
    }
  }

  const revealNumber = async () => {
    const provider = (await detectEthereumProvider()) as any;

    const encryptedData = await getEncryptedData();

    // @ts-ignore
    const decryptedData = await decryptData(user, Buffer.from(web3.utils.hexToBytes(encryptedData), 'utf8'));
    const revealedNumber = decryptedData.toString().split(',')[0];
    const nonce = decryptedData.toString().split(',')[1];

    if (provider) {
      console.log("found provider", "provider.selectedAddress:" + provider.selectedAddress);

      BetNumber.methods.revealNumber(betId, revealedNumber, nonce)
        .estimateGas({ from: provider.selectedAddress, value: 0 }, async function (error: any) {
          if (error === null) {
            const count = await web3.eth.getTransactionCount(provider.selectedAddress);
            console.log(provider.selectedAddress, 'getTransactionCount:', count.toString(10));

            try {
              await provider.request({
                method: 'eth_sendTransaction',
                params: [{
                  from: provider.selectedAddress,
                  to: contracts.BetNumber.address,
                  value: (0).toString(16),
                  data: web3.eth.abi.encodeFunctionCall({
                    name: 'revealNumber',
                    type: 'function',
                    inputs: [{
                      name: 'betId',
                      type: 'string',
                    }, {
                      name: 'revealedNumber',
                      type: 'int256',
                    }, {
                      name: 'nonce',
                      type: 'int256',
                    }],
                  }, [betId, revealedNumber, nonce]),
                  chainId: 31337,
                },],
              });
              showNotification({
                autoClose: 10000,
                title: "Your number has been revealed successfully",
                message: null,
                color: 'teal',
                icon: <IconCheck />
              });

              return true;
            } catch {
              return false;
            }
          } else {
            showNotification({
              autoClose: 10000,
              title: "Operation unsuccessful",
              message: String(error).split('\'')[1],
              color: 'red',
              icon: <IconX />
            });
          }
        });
    } else {
      console.log("Please install MetaMask!");
    }
  }

  return (
    <>
      <Button
        variant="subtle"
        onClick={revealNumber}
      >
        Reveal number
      </Button>
    </>
  )
}
