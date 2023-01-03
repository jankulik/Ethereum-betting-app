import Head from 'next/head';
import Shell from '../components/Shell';
import { useState } from 'react';
import UserGuesses from '../components/UserGuesses';
import { useStyles } from '../styles/MyBets.styles';

export default function MyBets() {
  const { classes, cx } = useStyles();

  const [isConnected, setIsConnected] = useState(false);
  const [accounts, setAccounts] = useState(Array<string>);
  const [connectedBalance, setConnectedBalance] = useState('0');

  const handleNewAccounts = (newAccounts: Array<string>) => setAccounts(newAccounts);
  const handleNewConnectedBalance = (newConnectedBalance: string) => setConnectedBalance(newConnectedBalance);
  const handleNewIsConnected = (newIsConneted: boolean) => setIsConnected(newIsConneted);

  return (
    <>
      <Head>
        <title>Betting dApp</title>
      </Head>

      <Shell
        isConnected={isConnected}
        accounts={accounts}
        connectedBalance={connectedBalance}
        handleNewAccounts={handleNewAccounts}
        handleNewConnectedBalance={handleNewConnectedBalance}
        handleNewIsConnected={handleNewIsConnected}
      >
        <div className={classes.wrapper}>
          <UserGuesses
            isConnected={isConnected}
            user={accounts[0]}
          />
        </div>
      </Shell>
    </>
  )
}