from app.agent.memory import (
    create_conversation,
    save_message,
    get_conversation_messages,
)


def main():
    print("\n=== CONVERSATION MEMORY TEST ===\n")

    # 1. Create conversation
    conversation_id = create_conversation(
        title="Memory Test"
    )

    print(
        f"Created conversation: "
        f"{conversation_id}"
    )

    # 2. Save user message
    user_message_id = save_message(
        conversation_id=conversation_id,
        role="user",
        content="What's my checking balance?",
    )

    print(
        f"Saved user message: "
        f"{user_message_id}"
    )

    # 3. Save assistant message
    assistant_message_id = save_message(
        conversation_id=conversation_id,
        role="assistant",
        content="Your current checking balance is $110.",
    )

    print(
        f"Saved assistant message: "
        f"{assistant_message_id}"
    )

    # 4. Load conversation
    messages = get_conversation_messages(
        conversation_id=conversation_id
    )

    print("\nStored messages:\n")

    for message in messages:
        print(
            f"{message['role']}: "
            f"{message['content']}"
        )

    print("\n=== TEST COMPLETE ===")


if __name__ == "__main__":
    main()