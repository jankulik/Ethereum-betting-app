import { useStyles } from './styles';
import { IconX, IconCheck } from '@tabler/icons';
import { Button } from '@mantine/core';
import detectEthereumProvider from '@metamask/detect-provider';
import blockchainnet from '../../blockchainnet.json';
import contracts from '../../contracts.json';
import { AbiItem } from 'web3-utils'
import Web3 from 'web3';
import { showNotification } from '@mantine/notifications';
import { NumberInput } from '@mantine/core';
import {useState} from "react"

interface RevealNumberSecretAnswerProps {
  betId: string,
  user: string,
}

export default function RevealNumberSecretAnswer({ betId, user }: RevealNumberSecretAnswerProps) {
  const { classes, cx } = useStyles();

  const [revealedNumber, setRevealedNumber] = useState<number>();

  const Testnet = blockchainnet.Testnet;
  const TestnetRpc = blockchainnet.TestnetRpc;

  const web3 = new Web3((Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc));
  const BetNumberSecretAnswer = new web3.eth.Contract(contracts.BetNumberSecretAnswer.abi as unknown as AbiItem, contracts.BetNumberSecretAnswer.address);
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

  const revealNumber = async () => {
    if(revealedNumber == undefined) {
      alert("Please provide a number");
      return;
    }
    const provider = (await detectEthereumProvider()) as any;


    if (provider) {
      console.log("found provider", "provider.selectedAddress:" + provider.selectedAddress);

      BetNumberSecretAnswer.methods.revealNumber(betId, revealedNumber)
        .estimateGas({ from: provider.selectedAddress, value: 0 }, async function (error: any) {
          if (error === null) {
            const count = await web3.eth.getTransactionCount(provider.selectedAddress);
            console.log(provider.selectedAddress, 'getTransactionCount:', count.toString(10));

            try {
              await provider.request({
                method: 'eth_sendTransaction',
                params: [{
                  from: provider.selectedAddress,
                  to: contracts.BetNumberSecretAnswer.address,
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
                    }],
                  }, [betId, revealedNumber!.toString()]),
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
      <NumberInput value={revealedNumber} placeholder="Revelaled Number" onChange={(value: number) => setRevealedNumber(value)}/>
      <Button
        variant="subtle"
        onClick={revealNumber}
      >
        Reveal number
      </Button>
    </>
  )
}
