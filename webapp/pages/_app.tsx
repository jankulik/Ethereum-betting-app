import { AppProps } from 'next/app';
import Head from 'next/head';
import { MantineProvider } from '@mantine/core';
import { NotificationsProvider } from '@mantine/notifications';
import { MetaMaskInpageProvider } from '@metamask/providers';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider
  }
}

export default function App(props: AppProps) {
  const { Component, pageProps } = props;

  const router = useRouter();

  useEffect(() => storePathValues, [router.asPath]);

  const storePathValues = () => {
    const storage = globalThis?.sessionStorage;

    if (!storage) return;
    
    const prevPath = storage.getItem('currentPath');
    prevPath !== null && storage.setItem('prevPath', prevPath);
    storage.setItem('currentPath', globalThis.location.pathname);
  }

  return (
    <>
      <Head>
        <title>Page title</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
      </Head>

      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme: 'light',
          cursorType: 'pointer',
          globalStyles: (theme) => ({
            '*, *::before, *::after': {
              boxSizing: 'border-box',
            },

            body: {
              ...theme.fn.fontStyles(),
              backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
              color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
              lineHeight: theme.lineHeight,
            },

            '.your-class': {
              backgroundColor: 'red',
            },

            '#your-id > [data-active]': {
              backgroundColor: 'pink',
            },
          }),
        }}
      >
        <NotificationsProvider>
          <Component {...pageProps} />
        </NotificationsProvider>
      </MantineProvider>
    </>
  );
}