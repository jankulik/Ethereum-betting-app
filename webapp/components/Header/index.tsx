import { Button, Burger, Text } from "@mantine/core";
import { useMediaQuery, useDisclosure, useClickOutside } from "@mantine/hooks";
import Link from "next/link";
import React, { useState } from "react";
import { useStyles } from "./styles";
import Sidebar from "../Sidebar";
import { useRouter } from "next/router"
import MetaMaskConnect from '../MetaMaskConnect';
import { IconMapSearch, IconUserCircle, IconFilePlus } from '@tabler/icons';

interface HeaderProps {
  isConnected: boolean,
  accounts: Array<string>,
  connectedBalance: string,
  handleNewAccounts(newAccounts: Array<string>): any,
  handleNewConnectedBalance(newConnectedBalance: string): any,
  handleNewIsConnected(newIsConneted: boolean): any,
}

export default function Header({
  isConnected,
  accounts,
  connectedBalance,
  handleNewAccounts,
  handleNewConnectedBalance,
  handleNewIsConnected,
}: HeaderProps) {
  const { classes, cx, theme } = useStyles();
  const [opened, { close, toggle }] = useDisclosure(false);
  const isSmallScreen = useMediaQuery(theme.fn.smallerThan("sm").split("@media ")[1]);

  const [sidebarRef, setSidebarRef] = useState<HTMLElement | null>(null);
  const [burgerRef, setBurgerRef] = useState<HTMLElement | null>(null);

  const menuList = [
    { label: "Explore Bets", link: "/", icon: IconMapSearch },
    { label: "My Bets", link: "/mybets", icon: IconUserCircle },
    { label: "My Guesses", link: "/myguesses", icon: IconUserCircle },
    { label: "Create Bet", link: "/newbet", icon: IconFilePlus },
  ];

  useClickOutside(() => close(), null, [sidebarRef!, burgerRef!]);

  const router = useRouter();
  const currentRoute = router.pathname;

  return (
    <>
      {(isSmallScreen && menuList.length > 0) &&
        <div
          ref={r => setSidebarRef(r)}
          className={
            cx(classes.sidebar, { [classes.sidebarActive]: opened === true })
          }
        >
          <Sidebar
            handleClick={close}
            links={menuList}
          />
        </div>
      }
      <header className={classes.root}>
        <div className={classes.leftContainer}>
          {menuList.length > 0 &&
            <Burger
              ref={r => setBurgerRef(r)}
              opened={opened}
              onClick={toggle}
              className={classes.burger}
              size="sm"
            />
          }

          <Link href="https://ethereum.org" passHref>
            <a style={{
              display: "flex",
              alignItems: "center",
            }}>
              <img src="ethereum.svg" height="36" />
            </a>
          </Link>
          <Text weight={700}>
            betting dApp
          </Text>
        </div>

        <div className={classes.navbarContainer}>
          <nav className={classes.navbar}>
            {menuList.map((item: any) => (
              <Link href={item.link} key={item.label} passHref>
                <a className={cx(classes.navbarItem, { [classes.navbarItemActive]: item.link === currentRoute })}>
                  {item.label}
                </a>
              </Link>
            ))}
          </nav>
        </div>

        <div className={classes.signInButtonContainer}>
          <MetaMaskConnect
            isConnected={isConnected}
            accounts={accounts}
            connectedBalance={connectedBalance}
            handleNewAccounts={handleNewAccounts}
            handleNewConnectedBalance={handleNewConnectedBalance}
            handleNewIsConnected={handleNewIsConnected}
          />
        </div>
      </header>
    </>
  );
}