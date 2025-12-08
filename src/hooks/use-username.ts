import { nanoid } from "nanoid";
import { useEffect, useState } from "react";

const moms = ["haiau", "chimmom", "me", "nayuta"];
const storageKey = "chat_username";

const generateUsername = () => {
  const mom = moms[Math.floor(Math.random() * moms.length)];
  return `anonymous-${mom}-${nanoid(5)}`;
};

export const useUsername = () => {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const main = () => {
      let username = localStorage.getItem(storageKey);
      if (username === null) {
        username = generateUsername();
        localStorage.setItem(storageKey, username);
      }
      setUsername(username);
    };

    main();
  }, []);

  return { username };
};
