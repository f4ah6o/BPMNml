# BPMNml [WIP]

[English/英語](./README.md) | Japanese/日本語

BPMNmlは、BPMNのマークアップ言語です。文法は当初[Class Digram](https://mermaid.js.org/syntax/classDiagram.html)にインスパイアされました。
[Mermaid](https://mermaid.js.org/)への対応を目指しています。

## デモ

* [BPMNml in langium playground](https://langium.org/playground?grammar=OYJwhgthYgBAQgBQLIDkIBsBQWD0vYALAF2IAcBnALn2AEtjCBXAIwDoBjAewlwgFMQ0OgBMAtACsKfQcJG4WGLi1wj%2BAN35KyuMmA4BrMMH7S9ICoNwUQHXBjAA7YE2P9c3KF0ceeEb2wOznRMEHgEdBBkXCDEsABEbGy%2BXj6e-o7xANxYdI7EggBm%2BvywAMJ%2B3rAA3liwsPocACKmHCAA-FSwFMQgecA59Y0AKgwY-J3dvf2DsMRjE109fc45AL44heDAAvmwo8TjAIKOIkccHKYUdCx0GAx0plR1sAAUr40tFG0AvEdlZQA%2Bk0AKIAZTKACVYAAfBoXA7jP4AwHDACSwwAMiDYXMFj90ViQQBKWAggDymOJAGosDksFtjLs4hTMbAQPxiEwQI4KFMVsBnvVUCCAOqYtEi6m4ikAMTpOAKQjyYAwsBF4slIK6uAAOh1dT4ckqICq1f8gaCIZCdQBtXVxAC6ACpPq0QK9Ovanc6qK9bQA9Q36l3tT0-ACkEeJMMDwZALpjuoozuq-oDa0Ta2JuGNsjNsAtqIx2LtDtgLpGC29Fd9nqocccIedYfakejsaDTYTzpzeeVjlV%2BxL2tguBrLvmh349YnjebrfbMbnXebML7OEIojUjjm%2BcHatFAAkMeDEP9R%2BPy47qbmsFuRDu9wOhwBNI7ITE6sQ-ifO-XtIas66mCyahgBhrEu0P5iPWEGODCnoAIQgcSG4Pk%2BJoFk0aKQiCZTogAapef5RtU9qgRQoZrFGcEGghyGoeh278LuWEHrAYKSgA4tigISiKgJlOSyDICCqDDGWPpRvOPZ3vgsDpN4OCsb0ACeCAoKgQr1OqYoCSCzovPU8QsGQECOGILCcmA8TGW89kagZzr7AsJxnBcVw3HcDymJpaDIFwagYEZum4k5WouUgAVBVo9lwhFIqhbpxIKuEsAtIUeSlOxQ4gEw4wUFguVqmiTR2mAYgAF5HGIABagKOralU1fVAAMYgAJyNc6d4lZxwyQjxOrxOm8T6oajrEs68QEHCuAAOTpgtE2OFNzoLX1%2B5DpKwzspy3K8rAjihNZIB2h1nU3ne94sWx22HmCOrJre9IKSC%2BQgBp%2BXjFg0WoIFwU6fUWj8MyFDUj8-0guMzLOm9BCZXkDxVFwhT%2BagsCg%2BDf1aTDYOqcD6qxbiFT5GA2VwHCZOOPwHDzN4COFiwyz6HEahZY4KO7mjDTHbFWCoLFRMgpoexwsMYAUAYuLcWABQAO5gGpTNI1zDM8%2BjThY2LxBYKLhP2QtGiqQtx2QPwPxlW8C0ADy22bJv5MMalkJbBvO67pQLQAfD7C1Qar-Cc9zsC807cTEF7RUe8QLtu0TPQwHEPywAtSexGbML2axIiwKnxunFn9l5Ca-AiHQ8ulAXpeyOXlcFAtQchxrYda3MUsGFgkvS0TC3EJ3ZuDgIVtNM3yOt7zYCwMAVdK2pWBy4ryt97Py9qUPFujzb9tm2v-Dz-HltLwfytH2nfsB%2B04-q3QqPo-v89zNHi9z2fXtE-wAAeHAYEw1yaHzmnb%2Bv9-50E0MXMK5hVTjDVAXaBGBYGQN0nkUBADq5p1QX-dBTccAKSOCzXobNYAcwnnfTWfNuDk0plgMmA9KZE0QFwLgao4SYicPwG%2Bocp6wGiCwrATCWF9z4RgTeI9rYLWqAteyYVsaqQhlDPGsNVLJXqAtNYuD0pq24e3II-AsDsNpn3PRYjLYSKkTI3Scj8gKOhso-Iqi04aK4ZPduVDab03IbQ7wHiNaJy4NyS4PxbRCzUFQMqjobY-n9riBaSQYlwgWj%2BAOHcQAmGIME0J-BwlNEia8BaVAzYOGshgH4YJBo8UDkAA&content=LQhQBcEtwGwUwFwAIBCAFAsgOSQZwIYC2ADvKCMKKAEbGEB2w1c4%2BoSHScAbnPeEgDKrAE7gAor35IAPDNyjwAPiXtOrXAGskAFXxaAgmo4BzfODgB3fAE8kAETgBjSLkgB7emneRpcuAAeTjAArm68KsZIGtp6WihRMbr6mgDCUTx8AuL0ACaSWbIyfLmRUcL4YgXSIErJhlFxmgZItQ7Orh5ePvxRji5unt6%2BAm1NKEjIAEQ2cLhTfR2D3SOtwHVNqZNIU-TuC5z1mhNtOflS4I0pW6d51ZdRxO7uMEgAZgreL0gA3lGHMHw9Dg7wUABkgSC-ocYZxMtIKmIAIxFBSVZSqWGw%2BHZPIAJiKJUiWJhAFJSUgsHA4LlcEh8LkAFZhcCEQr6JBOTzApxQTx0yogmCQQjQGnRdzRAAWINwXOIcH%2BWMR4BRt1yeKVHAAvlFtUA)

## Goal

* [ ] 主要なBPMN仕様に対応
* [ ] Mermaidにマージ
* [x] BPMN XMLのコード生成（基本、DIは未対応）

## 現在の機能

- イベント、タスク、ゲートウェイ、プール、レーン
- シーケンスフロー、アソシエーション、メッセージフロー
- プール境界のバリデーション（重複名、プール跨ぎの接続など）
- プール単位のプロセスとコラボレーションを含むXML生成（基本的なBPMN DIあり）

## 例

```BPMNml
---
title: BPMN デモ
---

bpmn-beta
    event StartEvent <<start>>
    task TaskA
    gateway DecisionPoint <<exclusive>>
    task TaskB
    task TaskC
    event EndEvent <<end>>

    StartEvent --> TaskA
    TaskA --> DecisionPoint
    DecisionPoint --> TaskB : "yes"
    DecisionPoint --> TaskC : "no"
    TaskB --> EndEvent
    TaskC --> EndEvent

    pool fstPool {
        lane fstLane {
            event Start1 <<start>>
            event End2 <<end>>
            Start1 --> End2
        }
    }
```

同一プール内であれば、レーンをまたいだ接続が可能です。

## コネクション

- `-->`, `..->`, `==>`: シーケンスフロー（同一プール内またはグローバル）
- `--`, `..`: アソシエーション
- `~~>`: メッセージフロー（プール間）

## 要素の種類

- イベント: `start`, `end`, `intermediate`, `message`, `timer`, `error`, `escalation`, `cancel`, `compensation`, `conditional`, `link`, `signal`, `terminate`, `multiple`, `parallel`
- タスク: `service`, `user`, `manual`, `send`, `receive`, `script`, `business-rule`
- ゲートウェイ: `exclusive`, `parallel`, `inclusive`, `event-based`, `complex`

## XML生成

```bash
pnpm bpmnxml -- examples/with-pools.bpmn out.bpmn.xml
```

## 参考

* [Business Process Model and Notation](https://www.omg.org/spec/BPMN)
* [Class diagrams](https://mermaid.js.org/syntax/classDiagram.html)
* [Adding a New Diagram/Chart 📊 | Mermaid](https://mermaid.js.org/community/new-diagram.html)
* [Grammar Language | langium](https://langium.org/docs/reference/grammar-language/)

## ライセンス

[Apache-2.0 license](./LICENSE)
