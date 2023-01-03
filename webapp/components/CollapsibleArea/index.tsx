import { useStyles } from './styles';
import { ActionIcon, Text, Collapse } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons';
import { useState } from 'react';

export default function CollapsibleArea({ children, title }: { children: any, title: string }) {
  const { classes, cx } = useStyles();

  const [collapseOpened, setCollapseOpened] = useState(false);

  return (
    <>
      <div className={classes.horizontalContainer}>
        <Text weight={500}>
          {title}
        </Text>

        <ActionIcon onClick={() => setCollapseOpened((o) => !o)} size='lg'>
          <IconChevronRight
            className={classes.chevron}
            size={22}
            style={{
              transform: collapseOpened ? `rotate(90deg)` : 'none',
            }}
          />
        </ActionIcon>
      </div>

      <Collapse in={collapseOpened}>
        <div className={classes.columnWrapper}>
          {children}
        </div>
      </Collapse>
    </>
  )
}