import { useStyles } from './styles';
import { useState } from 'react';
import { IconX, IconCheck, IconChevronDown } from '@tabler/icons';
import { Button, Select, Text, NumberInput } from '@mantine/core';
import detectEthereumProvider from '@metamask/detect-provider';
import blockchainnet from '../../blockchainnet.json';
import contracts from '../../contracts.json';
import { AbiItem } from 'web3-utils'
import Web3 from 'web3';
import { showNotification } from '@mantine/notifications';

interface ResolveBetMarketProps {
  betId: string;
  options: any;
}

export default function ResolveBetMarket({ betId, options }: ResolveBetMarketProps) {
  const { classes, cx } = useStyles();

  const [option, setOption] = useState<string | null>();

  const [optionError, setOptionError] = useState('');

  const Testnet = blockchainnet.Testnet;
  const TestnetRpc = blockchainnet.TestnetRpc;
  
  const web3 = new Web3((Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc));
  const BetMarket = new web3.eth.Contract(contracts.BetMarket.abi as unknown as AbiItem, contracts.BetMarket.address);

  const optionsData = options.map((option: any) => (
    { value: option, label: option }
  ));

  const handleResolveBet = () => {
    setOptionError('');

    if (option == null)
      setOptionError('Option must be defined');

    if (option != null)
      resolveBet();
  }

  const resolveBet = async () => {
    const provider = (await detectEthereumProvider()) as any;

    var optionId: number = options.length;
    for (var i = 0; i < options.length; i++) {
      if (options[i] == option)
        optionId = i;
    }

    if (provider) {
      console.log("found provider", "provider.selectedAddress:" + provider.selectedAddress);

      BetMarket.methods.resolveBet(betId, optionId)
        .estimateGas({ from: provider.selectedAddress, value: 0 }, async function (error: any) {
          if (error === null) {
            const count = await web3.eth.getTransactionCount(provider.selectedAddress);
            console.log(provider.selectedAddress, 'getTransactionCount:', count.toString(10));

            try {
              await provider.request({
                method: 'eth_sendTransaction',
                params: [{
                  from: provider.selectedAddress,
                  to: contracts.BetMarket.address,
                  value: (0).toString(16),
                  data: web3.eth.abi.encodeFunctionCall({
                    name: 'resolveBet',
                    type: 'function',
                    inputs: [{
                      name: 'betId',
                      type: 'string',
                    }, {
                      name: 'optionId',
                      type: 'uint256',
                    }],
                  }, [betId, optionId.toString()]),
                  chainId: 31337,
                },],
              });
              showNotification({
                autoClose: 10000,
                title: "Bet has been resolved successfullyy",
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
      <Select
        value={option}
        onChange={setOption}
        placeholder="Pick an option"
        rightSection={<IconChevronDown size={14} />}
        rightSectionWidth={28}
        data={optionsData}
        error={optionError ? optionError : false}
        styles={() => ({
          rightSection: {
            pointerEvents: 'none'
          },
          root: {
            width: '100%',
          },
        })}
      />

      <Button variant="subtle" compact onClick={handleResolveBet}>
        Resolve bet
      </Button>
    </div>
  )
}