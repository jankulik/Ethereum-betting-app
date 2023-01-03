import { useStyles } from './styles';
import {Text} from '@mantine/core';

interface NameValueProps {
  name: string,
  value: string|number,
}

export default function NameValue({ name, value }: NameValueProps) {
  const { classes, cx, theme } = useStyles();

  return (
    <>
      <Text size="sm" color={theme.colors.gray[5]}>
      {name}      
      </Text>
      <Text>
        {value}
      </Text>
    </>
  )
}
