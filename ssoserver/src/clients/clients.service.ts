import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuthClient } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(OAuthClient)
    private readonly clientsRepository: Repository<OAuthClient>,
  ) {}

  async create(createClientDto: any): Promise<any> {
    try {
      const client = this.clientsRepository.create(createClientDto);
      await this.clientsRepository.save(client);
      return { status: true, message: 'Client created successfully', client };
    } catch (error) {
      console.log('error',error)
      throw new HttpException(
        { status: false, message: 'Failed to create client', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findByClientId(clientId: string): Promise<any> {
    try {
      const client = await this.clientsRepository.findOne({
        where: { client_id: clientId },
      });

      if (!client) {
        throw new HttpException(
          { status: false, message: 'Client not found' },
          HttpStatus.NOT_FOUND
        );
      }

      return { status: true, message: 'Client found', client };
    } catch (error) {
      throw new HttpException(
        { status: false, message: 'Failed to retrieve client', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async validateClient(clientId: string, clientSecret?: string): Promise<any> {
    try {
      const clientData = await this.findByClientId(clientId);

      if (!clientData.status) {
        return clientData; // Client not found case already handled
      }

      const client = clientData.client;
      // if (clientSecret && client.client_secret !== clientSecret) {
      //   throw new HttpException(
      //     { status: false, message: 'Invalid client secret' },
      //     HttpStatus.UNAUTHORIZED
      //   );
      // }

      return { status: true, message: 'Client validated', client };
    } catch (error) {
      throw new HttpException(
        { status: false, message: 'Failed to validate client', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllClients(): Promise<any> {
    try {
      const clients = await this.clientsRepository.find();
      return { status: true, message: 'Clients retrieved successfully', clients };
    } catch (error) {
      throw new HttpException(
        { status: false, message: 'Failed to retrieve clients', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteClient(clientId: string): Promise<any> {
    try {
      const client = await this.clientsRepository.findOne({
        where: { client_id: clientId },
      });

      if (!client) {
        throw new HttpException(
          { status: false, message: 'Client not found or already deleted' },
          HttpStatus.NOT_FOUND
        );
      }

      await this.clientsRepository.delete({ client_id: clientId });
      return { status: true, message: 'Client deleted successfully' };
    } catch (error) {
      throw new HttpException(
        { status: false, message: 'Failed to delete client', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
