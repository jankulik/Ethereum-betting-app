import Header from '../Header';
import { useStyles } from './styles';

interface ShellProps {
  children: any,
  isConnected: boolean,
  accounts: Array<string>,
  connectedBalance: string,
  handleNewAccounts(newAccounts: Array<string>): any,
  handleNewConnectedBalance(newConnectedBalance: string): any,
  handleNewIsConnected(newIsConneted: boolean): any,
}

export default function Shell({
  children,
  isConnected,
  accounts,
  connectedBalance,
  handleNewAccounts,
  handleNewConnectedBalance,
  handleNewIsConnected,
}: ShellProps) {
  const { classes } = useStyles();

  return (
    <>
      {/* <div className={classes.root}> */}
      <Header
        isConnected={isConnected}
        accounts={accounts}
        connectedBalance={connectedBalance}
        handleNewAccounts={handleNewAccounts}
        handleNewConnectedBalance={handleNewConnectedBalance}
        handleNewIsConnected={handleNewIsConnected}
      />
      {/* <div className={classes.container}> */}
      {children}
      {/* </div> */}
      {/* </div> */}
    </>
  );
}
