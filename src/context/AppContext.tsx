import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface AppContextType {
  isNewFileModalOpen: boolean;
  setIsNewFileModalOpen: (isOpen: boolean) => void;
  isNewFolderModalOpen: boolean;
  setIsNewFolderModalOpen: (isOpen: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
interface AppContextProviderProps {
  children: ReactNode;
}
export const AppContextProvider: React.FC<AppContextProviderProps> = ({
  children,
}) => {
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);

  return (
    <AppContext.Provider
      value={{
        isNewFileModalOpen,
        setIsNewFileModalOpen,
        isNewFolderModalOpen,
        setIsNewFolderModalOpen,
      }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
};
