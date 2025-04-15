import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  transactionHash!: string;

  @Column()
  method!: string;

  @Column()
  block!: number;

  @Column()
  date!: Date;

  @Column()
  from!: string;

  @Column()
  to!: string;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  amount!: number;

  @Column()
  token!: string;

  @Column({ nullable: true })
  level!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
  
  @Column('decimal', { precision: 18, scale: 6, nullable: true })
  reservePool?: number;
}