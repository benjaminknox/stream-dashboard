import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";
import { DownIcon } from "@/components/down-icon";

export const SceneSelector = ({
  loading,
  sceneList,
  currentScene,
  handleStartScene,
}: {
  loading: boolean;
  sceneList: string[];
  currentScene?: string;
  handleStartScene: (name: string) => void;
}) => (
  <Dropdown placement="bottom-start">
    <DropdownTrigger>
      <Button
        variant="faded"
        isLoading={loading}
        endContent={<DownIcon size={11} filled />}
      >
        {currentScene
          ? `Currently streaming ${currentScene}`
          : process.env.NEXT_PUBLIC_DROPDOWN_TRIGGER ?? "Select scenes..."}
      </Button>
    </DropdownTrigger>
    <DropdownMenu
      aria-label="Scene selection"
      selectedKeys={new Set([`${currentScene}`])}
      selectionMode="single"
      onSelectionChange={(keys) => {
        handleStartScene(`${Array.from(keys)[0]}`);
      }}
    >
      {sceneList?.map((sceneName) => (
        <DropdownItem style={{ color: "white" }} key={sceneName}>
          {sceneName}
        </DropdownItem>
      ))}
    </DropdownMenu>
  </Dropdown>
);
