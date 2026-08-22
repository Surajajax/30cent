from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PlaidItem(Base):
    __tablename__ = "plaid_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    item_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    access_token: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    accounts: Mapped[list["Account"]] = relationship(
        back_populates="plaid_item",
        cascade="all, delete-orphan",
    )


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    plaid_account_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    plaid_item_id: Mapped[int] = mapped_column(
        ForeignKey("plaid_items.id"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    official_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    subtype: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    mask: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    available_balance: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    current_balance: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    currency: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True,
    )

    plaid_item: Mapped["PlaidItem"] = relationship(
        back_populates="accounts",
    )

    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="account",
        cascade="all, delete-orphan",
    )


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    plaid_transaction_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    account_id: Mapped[int] = mapped_column(
        ForeignKey("accounts.id"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    merchant_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    amount: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    transaction_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    category: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    currency: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True,
    )

    account: Mapped["Account"] = relationship(
        back_populates="transactions",
    )