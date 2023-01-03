import { useStyles } from './styles';
import { IconX, IconCheck, IconAlertCircle } from '@tabler/icons';
import { Button, Alert } from '@mantine/core';
import detectEthereumProvider from '@metamask/detect-provider';
import blockchainnet from '../../blockchainnet.json';
import contracts from '../../contracts.json';
import { AbiItem } from 'web3-utils'
import Web3 from 'web3';
import { showNotification } from '@mantine/notifications';

interface ForceFinishProps {
  betId: string,
  secretBet: boolean,
}

export default function ForceFinish({ betId, secretBet }: ForceFinishProps) {
  const { classes, cx } = useStyles();

  // const [betId, setBetId] = useState<any>('');
  // const [betIdError, setBetIdError] = useState('');

  const Testnet = blockchainnet.Testnet;
  const TestnetRpc = blockchainnet.TestnetRpc;

  const web3 = new Web3((Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc));

  const handleForceFinish = async () => {
    // setBetIdError('');

    // if (betId === '')
    //   setBetIdError('Bet ID must be defined');

    if (betId !== '') {
      forceFinish();
    }
  }

  const forceFinish = async () => {
    const provider = (await detectEthereumProvider()) as any;

    if (provider) {
      console.log("found provider", "provider.selectedAddress:" + provider.selectedAddress);

      if (!secretBet){
        const BetNumber = new web3.eth.Contract(contracts.BetNumber.abi as unknown as AbiItem, contracts.BetNumber.address);
        BetNumber.methods.forceFinishBet(betId)
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
                  title: "Your bet has been finished successfully",
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
        const BetNumberSecretAnswer = new web3.eth.Contract(contracts.BetNumberSecretAnswer.abi as unknown as AbiItem, contracts.BetNumberSecretAnswer.address);
        BetNumberSecretAnswer.methods.forceFinishBet(betId)
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
                  title: "Your bet has been finished successfully",
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
      }
    } else {
      console.log("Please install MetaMask!");
    }
  }

  return (
    <Alert icon={<IconAlertCircle size={16} />} color="red">
      <div className={classes.verticalContainer}>
        The owner of this bet didn't reveal the number on time. Force finish this bet in order to reclaim the invested funds.
        <Button
          variant="subtle"
          onClick={handleForceFinish}
        >
          Force finish
        </Button>
      </div>
    </Alert>
  )
}