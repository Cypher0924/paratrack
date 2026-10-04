"use client";

import { Button, Text } from "@repo/ui";

import styles from "../styles/index.module.css";

export default function Web() {
  return (
    <div className={styles.container}>
      <h1>Web</h1>
      <Button onPress={() => console.log("Pressed!")}>
        <Text>Boop</Text>
      </Button>
    </div>
  );
}
