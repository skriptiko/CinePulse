import { createTypedEmitter } from '@repo/events';
import { useEffect } from 'react';

const emitMfeReady = createTypedEmitter('mfe:ready');

function HelloWorld() {
  useEffect(() => {
    emitMfeReady({ name: 'helloMfe' });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-foreground">Hello World</h1>
      <p className="mt-4 text-muted-foreground">
        Welcome to CinePulse - A Micro Frontend Application
      </p>
    </div>
  );
}

export default HelloWorld;
