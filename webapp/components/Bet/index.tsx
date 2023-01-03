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

interface BetProps {
  betId: string,
}

export default function Bet({ betId }: BetProps) {
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
  const BetNumber = new web3.eth.Contract(contracts.BetNumber.abi as unknown as AbiItem, contracts.BetNumber.address);

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

  const bet = async () => {
    const provider = (await detectEthereumProvider()) as any;

    if (provider) {
      console.log("found provider", "provider.selectedAddress:" + provider.selectedAddress);

      BetNumber.methods.bet(betId, guess)
        .estimateGas({ from: provider.selectedAddress, value: betValue }, async function (error: any) {
          if (error === null) {
            const count = await web3.eth.getTransactionCount(provider.selectedAddress);
            console.log(provider.selectedAddress, 'getTransactionCount:', count.toString(10));
            
            try {
              await provider.request({
                method: 'eth_sendTransaction',
                params: [{
                  from: provider.selectedAddress,
                  to: contracts.BetNumber.address,
                  value: betValue?.toString(16),
                  data: web3.eth.abi.encodeFunctionCall({
                    name: 'bet',
                    type: 'function',
                    inputs: [{
                      name: 'betId',
                      type: 'string',
                    }, {
                      name: 'guess',
                      type: 'int256',
                    }],
                  }, [betId, guess!?.toString()]),
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
