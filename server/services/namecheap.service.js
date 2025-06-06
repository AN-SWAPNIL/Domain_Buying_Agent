import axios from "axios";

class NamecheapService {
  constructor() {
    this.apiUser = process.env.NAMECHEAP_API_USER;
    this.apiKey = process.env.NAMECHEAP_API_KEY;
    this.clientIp = process.env.NAMECHEAP_CLIENT_IP;
    this.sandbox = process.env.NAMECHEAP_SANDBOX === "true";
    this.baseUrl = this.sandbox
      ? "https://api.sandbox.namecheap.com/xml.response"
      : "https://api.namecheap.com/xml.response";
  }

  async checkDomainAvailability(domainName) {
    try {
      const params = {
        ApiUser: this.apiUser,
        ApiKey: this.apiKey,
        UserName: this.apiUser,
        Command: "namecheap.domains.check",
        ClientIp: this.clientIp,
        DomainList: domainName,
      };

      const response = await axios.get(this.baseUrl, { params });

      // Parse XML response (simplified - in production, use proper XML parser)
      const available = response.data.includes('Available="true"');
      const price = this.extractPriceFromResponse(response.data);

      return {
        domain: domainName,
        available,
        price: price || 0,
        currency: "USD",
      };
    } catch (error) {
      console.error("Namecheap API Error:", error.message);
      throw new Error("Failed to check domain availability");
    }
  }

  async registerDomain(domainName, years = 1, contactInfo) {
    try {
      const params = {
        ApiUser: this.apiUser,
        ApiKey: this.apiKey,
        UserName: this.apiUser,
        Command: "namecheap.domains.create",
        ClientIp: this.clientIp,
        DomainName: domainName,
        Years: years,
        // Contact information parameters
        RegistrantFirstName: contactInfo.firstName,
        RegistrantLastName: contactInfo.lastName,
        RegistrantAddress1: contactInfo.address,
        RegistrantCity: contactInfo.city,
        RegistrantStateProvince: contactInfo.state,
        RegistrantPostalCode: contactInfo.postalCode,
        RegistrantCountry: contactInfo.country,
        RegistrantPhone: contactInfo.phone,
        RegistrantEmailAddress: contactInfo.email,
        // Copy registrant info to other contact types
        TechFirstName: contactInfo.firstName,
        TechLastName: contactInfo.lastName,
        TechAddress1: contactInfo.address,
        TechCity: contactInfo.city,
        TechStateProvince: contactInfo.state,
        TechPostalCode: contactInfo.postalCode,
        TechCountry: contactInfo.country,
        TechPhone: contactInfo.phone,
        TechEmailAddress: contactInfo.email,
        AdminFirstName: contactInfo.firstName,
        AdminLastName: contactInfo.lastName,
        AdminAddress1: contactInfo.address,
        AdminCity: contactInfo.city,
        AdminStateProvince: contactInfo.state,
        AdminPostalCode: contactInfo.postalCode,
        AdminCountry: contactInfo.country,
        AdminPhone: contactInfo.phone,
        AdminEmailAddress: contactInfo.email,
        AuxBillingFirstName: contactInfo.firstName,
        AuxBillingLastName: contactInfo.lastName,
        AuxBillingAddress1: contactInfo.address,
        AuxBillingCity: contactInfo.city,
        AuxBillingStateProvince: contactInfo.state,
        AuxBillingPostalCode: contactInfo.postalCode,
        AuxBillingCountry: contactInfo.country,
        AuxBillingPhone: contactInfo.phone,
        AuxBillingEmailAddress: contactInfo.email,
      };

      const response = await axios.get(this.baseUrl, { params });

      // Parse response for success/failure
      const success = response.data.includes('Status="OK"');

      if (success) {
        return {
          success: true,
          domain: domainName,
          registrationId: this.extractRegistrationId(response.data),
        };
      } else {
        throw new Error("Domain registration failed");
      }
    } catch (error) {
      console.error("Domain Registration Error:", error.message);
      throw new Error("Failed to register domain");
    }
  }

  async getDomainInfo(domainName) {
    try {
      const params = {
        ApiUser: this.apiUser,
        ApiKey: this.apiKey,
        UserName: this.apiUser,
        Command: "namecheap.domains.getInfo",
        ClientIp: this.clientIp,
        DomainName: domainName,
      };

      const response = await axios.get(this.baseUrl, { params });

      return {
        domain: domainName,
        status: this.extractStatus(response.data),
        expirationDate: this.extractExpirationDate(response.data),
        autoRenew: this.extractAutoRenew(response.data),
      };
    } catch (error) {
      console.error("Get Domain Info Error:", error.message);
      throw new Error("Failed to get domain information");
    }
  }

  async setDNSRecords(domainName, records) {
    try {
      const params = {
        ApiUser: this.apiUser,
        ApiKey: this.apiKey,
        UserName: this.apiUser,
        Command: "namecheap.domains.dns.setHosts",
        ClientIp: this.clientIp,
        SLD: domainName.split(".")[0],
        TLD: domainName.split(".")[1],
      };

      // Add DNS records to params
      records.forEach((record, index) => {
        params[`HostName${index + 1}`] = record.name;
        params[`RecordType${index + 1}`] = record.type;
        params[`Address${index + 1}`] = record.value;
        params[`TTL${index + 1}`] = record.ttl || 3600;
      });

      const response = await axios.get(this.baseUrl, { params });

      const success = response.data.includes('Status="OK"');

      return {
        success,
        domain: domainName,
        records,
      };
    } catch (error) {
      console.error("Set DNS Records Error:", error.message);
      throw new Error("Failed to set DNS records");
    }
  }

  // Helper methods for parsing XML responses
  extractPriceFromResponse(xmlData) {
    // Simplified price extraction - implement proper XML parsing
    const match = xmlData.match(/price="([^"]+)"/);
    return match ? parseFloat(match[1]) : null;
  }

  extractRegistrationId(xmlData) {
    const match = xmlData.match(/DomainID="([^"]+)"/);
    return match ? match[1] : null;
  }

  extractStatus(xmlData) {
    const match = xmlData.match(/Status="([^"]+)"/);
    return match ? match[1] : "unknown";
  }

  extractExpirationDate(xmlData) {
    const match = xmlData.match(/Expires="([^"]+)"/);
    return match ? new Date(match[1]) : null;
  }

  extractAutoRenew(xmlData) {
    return xmlData.includes('AutoRenew="true"');
  }
}

export default new NamecheapService();
