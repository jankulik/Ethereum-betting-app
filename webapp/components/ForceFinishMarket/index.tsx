import { IconX, IconCheck, IconAlertCircle } from '@tabler/icons';
import { Button, Alert } from '@mantine/core';
import detectEthereumProvider from '@metamask/detect-provider';
import blockchainnet from '../../blockchainnet.json';
import contracts from '../../contracts.json';
import { AbiItem } from 'web3-utils'
import Web3 from 'web3';
import { showNotification } from '@mantine/notifications';
import { useStyles } from './styles';

interface ForceFinishMarketProps {
  betId: string;
}

export default function ForceFinishMarket({ betId }: ForceFinishMarketProps) {
  const { classes, cx, theme } = useStyles();

  const Testnet = blockchainnet.Testnet;
  const TestnetRpc = blockchainnet.TestnetRpc;

  const web3 = new Web3((Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc));
  const BetMarket = new web3.eth.Contract(contracts.BetMarket.abi as unknown as AbiItem, contracts.BetMarket.address);

  const forceFinishMarket = async () => {
    const provider = (await detectEthereumProvider()) as any;

    if (provider) {
      console.log("found provider", "provider.selectedAddress:" + provider.selectedAddress);

      BetMarket.methods.forceFinishBet(betId)
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
                    name: 'forceFinishBet',
                    type: 'function',
                    inputs: [{
                      name: 'betId',
                      type: 'string',
                    }],
                  }, [betId]),
                  chainId: 31337,
                },],
              });
              showNotification({
                autoClose: 10000,
                title: "Bet has been finished successfullyy",
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
    <Alert icon={<IconAlertCircle size={16} />} color="red">
      <div className={classes.verticalContainer}>
        The arbitrator of this bet didn't provide the verdict on time. Force finish this bet in order to reclaim the invested funds.
        <Button variant="subtle" color="red" compact onClick={forceFinishMarket}>
          Force finish
        </Button>
      </div>
    </Alert>
  )
}
