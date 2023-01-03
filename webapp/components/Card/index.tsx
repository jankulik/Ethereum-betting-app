import { useStyles } from './styles';
import { useState } from 'react';
import { CopyButton, Tooltip, ActionIcon, Button, Text, Collapse, Group } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons';
import TopUp from '../TopUp';
import ForceFinish from '../ForceFinish';
import WhitelistAddress from '../WhitelistAddress';
import RevealNumber from '../RevealNumber';
import GetGuesses from '../GetGuesses';

export default function Card({ children }: any) {
  const { classes, cx, theme } = useStyles();

  return (
    <div className={classes.card}>
      {children}
    </div>
  )
}
