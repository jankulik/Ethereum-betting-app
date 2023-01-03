import { useStyles } from './styles';
import CollapsibleArea from '../CollapsibleArea';
import AmountInput from '../AmountInput';
import { useState } from 'react';
import { Button, TextInput, NumberInput } from '@mantine/core';
import { IconClipboardX, IconCheck, IconX } from '@tabler/icons';
import detectEthereumProvider from '@metamask/detect-provider';
import blockchainnet from '../../blockchainnet.json';
import contracts from '../../contracts.json';
import { AbiItem } from 'web3-utils'
import Web3 from 'web3';
import { showNotification } from '@mantine/notifications';
import { encrypt } from '@metamask/eth-sig-util';

interface SecretBetProps {
  betId: string,
}

export default function SecretBet({ betId }: SecretBetProps) {
  const { classes, cx } = useStyles();

  const [betValue, setBetValue] = useState<number>();
  // const [betId, setBetId] = useState<any>('');
  const [guess, setGuess] = useState<number>();

  const [betValueError, setBetValueError] = useState('');
  // const [betIdError, setBetIdError] = useState('');
  const [guessError, setGuessError] = useState('');

  const Testnet = blockchainnet.Testnet;
  const TestnetRpc = blockchainnet.TestnetRpc;

  const web3 = new Web3((Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc));
  const BetNumberSecretAnswer = new web3.eth.Contract(contracts.BetNumberSecretAnswer.abi as unknown as AbiItem, contracts.BetNumberSecretAnswer.address);

  const ascii85 = require('ascii85');

  const handleNewBetValue = (newBetValue: number) => setBetValue(newBetValue);

  const handleBet = async () => {
    setBetValueError('');
    // setBetIdError('');
    setGuessError('');

    if (betValue === 0)
      setBetValueError('Bet value must be greater than 0');
    if (betValue === undefined || betValue === null)
      setBetValueError('Bet value must be defined');
    // if (betId === '')
    //   setBetIdError('Bet ID must be defined');
    if (guess === undefined)
      setGuessError('Guess must be defined');

    if (betValue !== 0 &&
      betValue !== undefined &&
      betId !== '' &&
      guess !== undefined) {
      bet();
    }
  }

  const generateNonce = (len: number) => {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < len; i++) {
      var index = Math.floor(Math.random() * charactersLength);

      while (i === 0 && index === 0) {
        index = Math.floor(Math.random() * charactersLength);
      }

      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }

  function encryptData(publicKey: Buffer, data: Buffer): string {
    const enc = encrypt({
      publicKey: publicKey.toString('base64'),
      data: ascii85.encode(data).toString(),
      version: 'x25519-xsalsa20-poly1305',
    });

    const buf = Buffer.concat([
      Buffer.from(enc.ephemPublicKey, 'base64'),
      Buffer.from(enc.nonce, 'base64'),
      Buffer.from(enc.ciphertext, 'base64'),
    ]);

    return web3.utils.bytesToHex(buf.toJSON().data);
  }
  const bet = async () => {
    const provider = (await detectEthereumProvider()) as any;

    var keyB64;
    try {
      keyB64 = await window.ethereum?.request({
        method: 'eth_getEncryptionPublicKey',
        params: [provider.selectedAddress],
      }) as string;
    } catch {
      return false;
    }
    const publicKey = Buffer.from(keyB64, 'base64');

    const nonce = generateNonce(40);
    const valueToStore = web3.eth.abi.encodeParameters(['uint256', 'uint256'], [guess, nonce]);
    const localHash = web3.utils.soliditySha3(valueToStore);

    const encryptedData = encryptData(publicKey, Buffer.from(guess!.toString().concat(',', nonce.toString()), 'utf8'));

    if (provider) {
      console.log("found provider", "provider.selectedAddress:" + provider.selectedAddress);

      BetNumberSecretAnswer.methods.encryptedBet(betId, localHash, encryptedData)
        .estimateGas({ from: provider.selectedAddress, value: betValue }, async function (error: any) {
          if (error === null) {
            const count = await web3.eth.getTransactionCount(provider.selectedAddress);
            console.log(provider.selectedAddress, 'getTransactionCount:', count.toString(10));
            
            try {
              await provider.request({
                method: 'eth_sendTransaction',
                params: [{
                  from: provider.selectedAddress,
                  to: contracts.BetNumberSecretAnswer.address,
                  value: betValue?.toString(16),
                  data: web3.eth.abi.encodeFunctionCall({
                    name: 'encryptedBet',
                    type: 'function',
                    inputs: [{
                      name: 'id',
                      type: 'string',
                    },{
                      name: 'localHash',
                      type: 'uint256',
                    }, {
                      name: 'encryptedData',
                      type: 'bytes'
                    }],
                  }, [betId, localHash!, encryptedData]),
                  chainId: 31337,
                },],
              });
              showNotification({
                autoClose: 10000,
                title: "Your bet has been placed successfully",
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
    <div className={classes.columnWrapper}>
      <AmountInput
        betValueError={betValueError}
        label="Bet value"
        handleNewBetValue={handleNewBetValue}
      />

      {/* <TextInput
        value={betId}
        onChange={(event) => setBetId(event.currentTarget.value)}
        placeholder="Enter ID"
        label="Bet ID"
        icon={<IconId size={16} />}
        error={betIdError ? betIdError : false}
        styles={() => ({
          root: {
            width: '100%',
          },
        })}
      /> */}

      <NumberInput
        value={guess}
        onChange={(value) => setGuess(value)}
        placeholder="Pick a number"
        label="Guess"
        icon={<IconClipboardX size={16} />}
        // precision={2}
        error={guessError ? guessError : false}
        styles={() => ({
          root: {
            width: '100%',
          },
        })}
      />

      <Button
        variant="subtle"
        onClick={handleBet}
      >
        Bet
      </Button>
    </div>
  )
}
