# Aardvarkland Workflow Lab

[Česky](#česky) · [Open previews](https://michalmachalik.github.io/Aardvarkland-Workflow-Lab/)

| Workflow | What to try |
| --- | --- |
| [Dispatch verification](https://michalmachalik.github.io/Aardvarkland-Workflow-Lab/dispatch/) | Verify a packing record, then try one for another shipment. Compare the result and supporting evidence. |
| [Service booking](https://michalmachalik.github.io/Aardvarkland-Workflow-Lab/booking/) | Change the number of units and district, submit a request and inspect its conversion record. |
| [Issue handover](https://michalmachalik.github.io/Aardvarkland-Workflow-Lab/handover/) | Take an issue as a technician, attach a sample proof, return it as reviewer and close it after rework. |

```sh
npm ci --ignore-scripts
npm test
npm run dev
```

The previews use fictional data. Booking receipts and handover records are stored in the current browser. The handover role selector lets readers exercise the three workflow roles.

**Dispatch connector.** React and .NET 10 read the same sample records. Start the REST API with `dotnet run --project connector` and set `VITE_CONNECTOR=live` before launching Vite. Build with `dotnet build connector`, then run `node scripts/test-connector.mjs` to compare browser, REST and MCP results. MCP clients can launch `dotnet connector/bin/Debug/net10.0/DispatchConnector.dll --mcp` as a stdio server.

**WordPress.** Copy `wordpress/aardvarkland-booking` into `wp-content/plugins`, activate it, then add `[aardvarkland_booking]` to a page. WordPress 6.5+ and PHP 7.4+ are required. The plugin and the static preview share their markup, styles and calculation code.

MIT. Font and bundle notices are included in the built site.

## Česky

- [Ověření expedice](https://michalmachalik.github.io/Aardvarkland-Workflow-Lab/dispatch/) ověří správný balicí protokol a vysvětlí, proč podklad jiné zásilky nestačí.
- [Servisní poptávka](https://michalmachalik.github.io/Aardvarkland-Workflow-Lab/booking/) počítá cenu podle počtu jednotek a dopravy, vytváří potvrzení a záznam konverze.
- [Předávání závad](https://michalmachalik.github.io/Aardvarkland-Workflow-Lab/handover/) umožní nahlášení, převzetí, doložení opravy, vrácení k doplnění i schválení.

Ukázky pracují s fiktivními daty. Poptávky a historie předání se ukládají v prohlížeči. Ověření expedice lze spustit s místním konektorem v .NET přes REST nebo MCP. Stejné rozhraní servisní poptávky lze vložit do WordPressu shortcodem `[aardvarkland_booking]`. Příkazy a postup instalace jsou v anglické části.
