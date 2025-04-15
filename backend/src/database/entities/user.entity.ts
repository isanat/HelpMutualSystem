import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  address!: string;

  @Column({ default: false })
  isRegistered!: boolean;

  @Column({ default: 0 })
  currentLevel!: number;

  @Column()
  sponsor!: string;

  @Column({ default: 0 })
  referrals!: number;

  @Column({ type: 'decimal', precision: 18, scale: 6, default: 0 })
  balance!: number;

  @Column({ default: 0 })
  donationsReceived!: number;

  @Column({ default: false })
  hasDonated!: boolean;

  @Column({ default: 0 })
  queuePosition!: number;

  @Column({ nullable: true })
  registrationDate!: Date;

  @Column({ type: 'decimal', precision: 18, scale: 6, default: 0 })
  entryFee!: number;

  @Column({ type: 'decimal', precision: 18, scale: 6, default: 0 })
  helpBalance!: number;

  @Column({ default: false })
  isInQueue!: boolean;

  @Column({ type: 'decimal', precision: 18, scale: 6, default: 0 })
  lockedAmount!: number;

  @Column({ type: 'bigint', default: 0 })
  unlockTimestamp!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}