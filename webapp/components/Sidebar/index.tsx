import { useStyles } from "./styles";
import { TablerIcon } from "@tabler/icons";
import Link from "next/link";
import { useRouter } from "next/router"

interface SidebarActionProps {
  handleClick(): void;
  links: { label: string; link: string; icon: TablerIcon }[];
}

export default function Sidebar({ handleClick, links }: SidebarActionProps) {
  const { classes, cx, theme } = useStyles();

  const router = useRouter();
  const currentRoute = router.pathname;

  return (
    <>
      {links.map((item) => (
        <div className={classes.menuItem} key={item.label}>
          <Link href={item.link} passHref>
            <a onClick={() => handleClick()} className={cx(classes.link, { [classes.linkActive]: item.link === currentRoute })}>
              <item.icon className={classes.linkIcon} stroke={1.5} />
              <span>{item.label}</span>
            </a>
          </Link>
        </div>
      ))}
    </>
  );
}
